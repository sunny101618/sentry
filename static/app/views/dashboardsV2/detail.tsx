import React from 'react';
import {browserHistory, PlainRoute, WithRouterProps} from 'react-router';
import styled from '@emotion/styled';
import isEqual from 'lodash/isEqual';

import {
  createDashboard,
  deleteDashboard,
  updateDashboard,
} from 'app/actionCreators/dashboards';
import {addSuccessMessage} from 'app/actionCreators/indicator';
import {Client} from 'app/api';
import NotFound from 'app/components/errors/notFound';
import LightWeightNoProjectMessage from 'app/components/lightWeightNoProjectMessage';
import LoadingIndicator from 'app/components/loadingIndicator';
import GlobalSelectionHeader from 'app/components/organizations/globalSelectionHeader';
import {t} from 'app/locale';
import {PageContent} from 'app/styles/organization';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import withApi from 'app/utils/withApi';
import withOrganization from 'app/utils/withOrganization';

import Controls from './controls';
import Dashboard from './dashboard';
import {DEFAULT_STATS_PERIOD, EMPTY_DASHBOARD} from './data';
import OrgDashboards from './orgDashboards';
import DashboardTitle from './title';
import {DashboardDetails, DashboardState, Widget} from './types';
import {cloneDashboard} from './utils';

const UNSAVED_MESSAGE = t('You have unsaved changes, are you sure you want to leave?');

type Props = {
  api: Client;
  organization: Organization;
  route: PlainRoute;
} & WithRouterProps<{orgId: string; dashboardId: string}, {}>;

type State = {
  dashboardState: DashboardState;
  modifiedDashboard: DashboardDetails | null;
};

class DashboardDetail extends React.Component<Props, State> {
  state: State = {
    dashboardState: 'view',
    modifiedDashboard: null,
  };

  componentDidMount() {
    const {route, router} = this.props;
    this.checkStateRoute();
    router.setRouteLeaveHook(route, this.onRouteLeave);
    window.addEventListener('beforeunload', this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload);
  }

  checkStateRoute() {
    if (this.isWidgetBuilderRouter && !this.isEditing) {
      const {router, organization, params} = this.props;
      const {dashboardId} = params;
      router.replace(`/organizations/${organization.slug}/dashboards/${dashboardId}/`);
    }
  }

  updateRouteAfterSavingWidget() {
    if (this.isWidgetBuilderRouter) {
      const {router, organization, params} = this.props;
      const {dashboardId} = params;
      router.replace(`/organizations/${organization.slug}/dashboards/${dashboardId}/`);
    }
  }

  get isEditing() {
    const {dashboardState} = this.state;
    return ['edit', 'create', 'pending_delete'].includes(dashboardState);
  }

  get isWidgetBuilderRouter() {
    const {location, params, organization} = this.props;
    const {dashboardId} = params;

    return (
      location.pathname ===
      `/organizations/${organization.slug}/dashboards/${dashboardId}/widget/new/`
    );
  }

  onEdit = (dashboard: State['modifiedDashboard']) => () => {
    if (!dashboard) {
      return;
    }

    trackAnalyticsEvent({
      eventKey: 'dashboards2.edit.start',
      eventName: 'Dashboards2: Edit start',
      organization_id: parseInt(this.props.organization.id, 10),
    });

    this.setState({
      dashboardState: 'edit',
      modifiedDashboard: cloneDashboard(dashboard),
    });
  };

  onRouteLeave = () => {
    if (!['view', 'pending_delete'].includes(this.state.dashboardState)) {
      return UNSAVED_MESSAGE;
    }

    return undefined;
  };

  onUnload = (event: BeforeUnloadEvent) => {
    if (['view', 'pending_delete'].includes(this.state.dashboardState)) {
      return;
    }
    event.preventDefault();
    event.returnValue = UNSAVED_MESSAGE;
  };

  onCreate = () => {
    trackAnalyticsEvent({
      eventKey: 'dashboards2.create.start',
      eventName: 'Dashboards2: Create start',
      organization_id: parseInt(this.props.organization.id, 10),
    });
    this.setState({
      dashboardState: 'create',
      modifiedDashboard: cloneDashboard(EMPTY_DASHBOARD),
    });
  };

  onCancel = () => {
    if (this.state.dashboardState === 'create') {
      trackAnalyticsEvent({
        eventKey: 'dashboards2.create.cancel',
        eventName: 'Dashboards2: Create cancel',
        organization_id: parseInt(this.props.organization.id, 10),
      });
    } else if (this.state.dashboardState === 'edit') {
      trackAnalyticsEvent({
        eventKey: 'dashboards2.edit.cancel',
        eventName: 'Dashboards2: Edit cancel',
        organization_id: parseInt(this.props.organization.id, 10),
      });
    }
    this.setState({
      dashboardState: 'view',
      modifiedDashboard: null,
    });
  };

  onDelete = (dashboard: State['modifiedDashboard']) => () => {
    const {api, organization, location} = this.props;
    if (!dashboard?.id) {
      return;
    }

    const previousDashboardState = this.state.dashboardState;

    this.setState(
      {
        dashboardState: 'pending_delete',
      },
      () => {
        trackAnalyticsEvent({
          eventKey: 'dashboards2.delete',
          eventName: 'Dashboards2: Delete',
          organization_id: parseInt(this.props.organization.id, 10),
        });
        deleteDashboard(api, organization.slug, dashboard.id)
          .then(() => {
            addSuccessMessage(t('Dashboard deleted'));

            browserHistory.replace({
              pathname: `/organizations/${organization.slug}/dashboards/`,
              query: {
                ...location.query,
              },
            });
          })
          .catch(() => {
            this.setState({
              dashboardState: previousDashboardState,
            });
          });
      }
    );
  };

  onCommit = ({
    dashboard,
    reloadData,
  }: {
    dashboard: State['modifiedDashboard'];
    reloadData: () => void;
  }) => () => {
    const {api, organization, location} = this.props;
    const {dashboardState, modifiedDashboard} = this.state;

    switch (dashboardState) {
      case 'create': {
        if (modifiedDashboard) {
          createDashboard(api, organization.slug, modifiedDashboard).then(
            (newDashboard: DashboardDetails) => {
              addSuccessMessage(t('Dashboard created'));
              trackAnalyticsEvent({
                eventKey: 'dashboards2.create.complete',
                eventName: 'Dashboards2: Create complete',
                organization_id: parseInt(organization.id, 10),
              });
              this.setState({
                dashboardState: 'view',
                modifiedDashboard: null,
              });

              // redirect to new dashboard
              browserHistory.replace({
                pathname: `/organizations/${organization.slug}/dashboards/${newDashboard.id}/`,
                query: {
                  ...location.query,
                },
              });
            }
          );
        }

        break;
      }
      case 'edit': {
        if (modifiedDashboard) {
          // only update the dashboard if there are changes
          if (isEqual(dashboard, modifiedDashboard)) {
            this.setState({
              dashboardState: 'view',
              modifiedDashboard: null,
            });
            return;
          }

          updateDashboard(api, organization.slug, modifiedDashboard).then(
            (newDashboard: DashboardDetails) => {
              addSuccessMessage(t('Dashboard updated'));
              trackAnalyticsEvent({
                eventKey: 'dashboards2.edit.complete',
                eventName: 'Dashboards2: Edit complete',
                organization_id: parseInt(organization.id, 10),
              });

              this.setState({
                dashboardState: 'view',
                modifiedDashboard: null,
              });

              if (dashboard && newDashboard.id !== dashboard.id) {
                browserHistory.replace({
                  pathname: `/organizations/${organization.slug}/dashboards/${newDashboard.id}/`,
                  query: {
                    ...location.query,
                  },
                });
                return;
              }
              reloadData();
            }
          );

          return;
        }

        this.setState({
          dashboardState: 'view',
          modifiedDashboard: null,
        });
        break;
      }
      case 'view':
      default: {
        this.setState({
          dashboardState: 'view',
          modifiedDashboard: null,
        });
        break;
      }
    }
  };

  onWidgetChange = (widgets: Widget[]) => {
    const {modifiedDashboard} = this.state;

    if (modifiedDashboard === null) {
      return;
    }

    this.setState((prevState: State) => {
      return {
        ...prevState,
        modifiedDashboard: {
          ...prevState.modifiedDashboard!,
          widgets,
        },
      };
    });
  };

  setModifiedDashboard = (dashboard: DashboardDetails) => {
    this.setState({
      modifiedDashboard: dashboard,
    });
  };

  onSaveWidget = (widgets: Widget[]) => {
    const {modifiedDashboard} = this.state;

    if (modifiedDashboard === null) {
      return;
    }

    this.setState(
      (state: State) => ({
        ...state,
        modifiedDashboard: {
          ...state.modifiedDashboard!,
          widgets,
        },
      }),
      this.updateRouteAfterSavingWidget
    );
  };

  renderDetails({
    dashboard,
    dashboards,
    reloadData,
    error,
  }: Parameters<OrgDashboards['props']['children']>[0]) {
    const {organization, params, router} = this.props;
    const {modifiedDashboard, dashboardState} = this.state;
    const {dashboardId} = params;

    return (
      <GlobalSelectionHeader
        skipLoadLastUsed={organization.features.includes('global-views')}
        defaultSelection={{
          datetime: {
            start: null,
            end: null,
            utc: false,
            period: DEFAULT_STATS_PERIOD,
          },
        }}
      >
        <PageContent>
          <LightWeightNoProjectMessage organization={organization}>
            <StyledPageHeader>
              <DashboardTitle
                dashboard={modifiedDashboard || dashboard}
                onUpdate={this.setModifiedDashboard}
                isEditing={this.isEditing}
              />
              <Controls
                organization={organization}
                dashboards={dashboards}
                dashboard={dashboard}
                onEdit={this.onEdit(dashboard)}
                onCreate={this.onCreate}
                onCancel={this.onCancel}
                onCommit={this.onCommit({dashboard, reloadData})}
                onDelete={this.onDelete(dashboard)}
                dashboardState={dashboardState}
              />
            </StyledPageHeader>
            {error ? (
              <NotFound />
            ) : dashboard ? (
              <Dashboard
                paramDashboardId={dashboardId}
                dashboard={modifiedDashboard || dashboard}
                organization={organization}
                isEditing={this.isEditing}
                onUpdate={this.onWidgetChange}
                router={router}
              />
            ) : (
              <LoadingIndicator />
            )}
          </LightWeightNoProjectMessage>
        </PageContent>
      </GlobalSelectionHeader>
    );
  }

  renderWidgetBuilder(dashboard: DashboardDetails | null) {
    const {children} = this.props;
    const {modifiedDashboard} = this.state;

    return React.isValidElement(children)
      ? React.cloneElement(children, {
          dashboard: modifiedDashboard || dashboard,
          onSave: this.onSaveWidget,
        })
      : children;
  }

  render() {
    const {api, location, params, organization} = this.props;

    return (
      <OrgDashboards
        api={api}
        location={location}
        params={params}
        organization={organization}
      >
        {({dashboard, dashboards, error, reloadData}) => {
          if (this.isEditing && this.isWidgetBuilderRouter) {
            return this.renderWidgetBuilder(dashboard);
          }
          return this.renderDetails({dashboard, dashboards, error, reloadData});
        }}
      </OrgDashboards>
    );
  }
}

const StyledPageHeader = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-row-gap: ${space(2)};
  align-items: center;
  font-size: ${p => p.theme.headerFontSize};
  color: ${p => p.theme.textColor};
  margin-bottom: ${space(2)};

  @media (min-width: ${p => p.theme.breakpoints[1]}) {
    grid-template-columns: minmax(0, 1fr) max-content;
    grid-column-gap: ${space(2)};
    height: 40px;
  }
`;

export default withApi(withOrganization(DashboardDetail));
