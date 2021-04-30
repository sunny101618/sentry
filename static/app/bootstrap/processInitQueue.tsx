import {renderDom} from './renderDom';
import {renderOnDomReady} from './renderOnDomReady';

const COMPONENT_MAP = {
  Indicators: () => import('app/components/indicators'),
  SystemAlerts: () => import('app/views/app/systemAlerts'),
  SetupWizard: () => import('app/views/setupWizard'),
  U2fSign: () => import('app/components/u2f/u2fsign'),
};

/**
 * This allows server templates to push "tasks" to be run after application has initialized.
 * The global `window.__onSentryInit` is used for this.
 */
export async function processInitQueue() {
  if (!Array.isArray(window.__onSentryInit)) {
    return;
  }

  /**
   * Be careful here as we can not guarantee type safety on `__onSentryInit` as
   * these will be defined in server rendered templates
   */
  const promises = window.__onSentryInit.map(async initConfig => {
    if (initConfig.name === 'passwordStrength') {
      const {input, element} = initConfig;
      if (!input || !element) {
        return;
      }

      // The password strength component is very heavyweight as it includes the
      // zxcvbn, a relatively byte-heavy password strength estimation library. Load
      // it on demand.
      const passwordStrength = await import('app/components/passwordStrength');

      passwordStrength.attachTo({
        input: document.querySelector(input),
        element: document.querySelector(element),
      });

      return;
    }

    if (initConfig.name === 'renderReact') {
      if (!COMPONENT_MAP.hasOwnProperty(initConfig.component)) {
        return;
      }
      const {default: Component} = await COMPONENT_MAP[initConfig.component]();

      renderOnDomReady(() =>
        renderDom(Component, initConfig.container, initConfig.props)
      );
    }
  });

  // These are all side-effects, so no need to return a value, but allow consumer to
  // wait for all initialization to finish
  await Promise.all(promises);
}
