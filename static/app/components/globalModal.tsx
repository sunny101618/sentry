import React from 'react';
import ReactDOM from 'react-dom';
import {browserHistory} from 'react-router';
import {css} from '@emotion/react';
import styled from '@emotion/styled';
import {createFocusTrap, FocusTrap} from 'focus-trap';
import {AnimatePresence, motion} from 'framer-motion';
import memoize from 'lodash/memoize';

import {closeModal as actionCloseModal} from 'app/actionCreators/modal';
import Button from 'app/components/button';
import {ROOT_ELEMENT} from 'app/constants';
import {IconClose} from 'app/icons';
import {t} from 'app/locale';
import ModalStore from 'app/stores/modalStore';
import space from 'app/styles/space';
import testableTransition from 'app/utils/testableTransition';

type ModalOptions = {
  onClose?: () => void;
  modalCss?: ReturnType<typeof css>;
  backdrop?: 'static' | boolean | undefined;
};

type Props = {
  /**
   * Configuration of the modal
   */
  options: ModalOptions;
  /**
   * Is the modal visable
   */
  visible: boolean;
  /**
   * A function that returns a React Element
   */
  children?: null | ((renderProps: ModalRenderProps) => React.ReactNode);
  /**
   * Note this is the callback for the main App container and NOT the calling
   * component. GlobalModal is never used directly, but is controlled via
   * stores. To access the onClose callback from the component, you must
   * specify it when using the action creator.
   */
  onClose?: () => void;
};

const BaseHeader = styled('header')`
  position: relative;
  border-bottom: 1px solid ${p => p.theme.border};
  padding: ${space(3)} ${space(4)};
  margin: -${space(4)} -${space(4)} ${space(3)} -${space(4)};

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 0;
    line-height: 1.1;
  }
`;

const Body = styled('div')`
  font-size: 15px;

  p:last-child {
    margin-bottom: 0;
  }

  img {
    max-width: 100%;
  }
`;

const Footer = styled('footer')`
  border-top: 1px solid ${p => p.theme.border};
  display: flex;
  justify-content: flex-end;
  padding: ${space(3)} ${space(4)};
  margin: ${space(3)} -${space(4)} -${space(4)};
`;

type HeaderProps = {
  /**
   * Show a close button in the header
   */
  closeButton?: boolean;
};

const makeClosableHeader = (closeModal: () => void) => {
  const ClosableHeader: React.FC<
    React.ComponentProps<typeof BaseHeader> & HeaderProps
  > = ({closeButton, children, ...props}) => (
    <BaseHeader {...props}>
      {children}
      {closeButton && <CloseButton onClick={closeModal} />}
    </BaseHeader>
  );

  ClosableHeader.displayName = 'Header';

  return ClosableHeader;
};

type ModalRenderProps = {
  closeModal: () => void;
  Header: ReturnType<typeof makeClosableHeader>;
  Body: typeof Body;
  Footer: typeof Footer;
};

const getModalPortal = memoize(() => {
  let portal = document.getElementById('modal-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.setAttribute('id', 'modal-portal');
    document.body.appendChild(portal);
  }

  return portal as HTMLDivElement;
});

function GlobalModal({visible = false, options = {}, children, onClose}: Props) {
  const closeModal = React.useCallback(() => {
    // Option close callback, from the thing which opened the modal
    options.onClose?.();

    // Action creator, actually closes the modal
    actionCloseModal();

    // GlobalModal onClose prop callback
    onClose?.();
  }, [options]);

  const handleEscapeClose = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    },
    [closeModal]
  );

  const portal = getModalPortal();
  const focusTrap = React.useRef<FocusTrap>();

  React.useEffect(() => void (focusTrap.current = createFocusTrap(portal)), []);

  React.useEffect(() => {
    const body = document.querySelector('body');
    const root = document.getElementById(ROOT_ELEMENT);

    if (!body || !root) {
      return () => void 0;
    }

    const reset = () => {
      body.style.removeProperty('overflow');
      root.removeAttribute('aria-hidden');
      focusTrap.current?.deactivate();
      portal.removeEventListener('keydown', handleEscapeClose);
    };

    if (visible) {
      body.style.overflow = 'hidden';
      root.setAttribute('aria-hidden', 'true');
      focusTrap.current?.activate();
      portal.addEventListener('keydown', handleEscapeClose);
    } else {
      reset();
    }

    return reset;
  }, [visible]);

  const Header = makeClosableHeader(closeModal);
  const renderedChild = children?.({Header, Body, Footer, closeModal});

  // Default to enabled backdrop
  const backdrop = options.backdrop ?? true;

  return ReactDOM.createPortal(
    <React.Fragment>
      <Backdrop
        onClick={backdrop === true ? closeModal : undefined}
        style={backdrop && visible ? {opacity: 0.5, pointerEvents: 'auto'} : {}}
      />
      <Container>
        <AnimatePresence>
          {visible && (
            <Modal role="dialog" className="modal-dialog" css={options.modalCss}>
              <Content role="document" className="modal-content">
                {renderedChild}
              </Content>
            </Modal>
          )}
        </AnimatePresence>
      </Container>
    </React.Fragment>,
    portal
  );
}

const CloseButton = styled(Button)`
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  border-radius: 50%;
  background: ${p => p.theme.background};
  height: 24px;
  width: 24px;
`;

CloseButton.defaultProps = {
  label: t('Close Modal'),
  icon: <IconClose size="10px" />,
  size: 'zero',
};

const fullPageCss = css`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const Backdrop = styled('div')`
  ${fullPageCss};
  z-index: ${p => p.theme.zIndex.modal};
  background: ${p => p.theme.gray500};
  will-change: opacity;
  transition: opacity 200ms;
  pointer-events: none;
  opacity: 0;
`;

const Container = styled('div')`
  ${fullPageCss};
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  pointer-events: none;
  justify-content: center;
`;

const Modal = styled(motion.div)`
  width: 600px;
  pointer-events: auto;
  padding-top: 80px;
  padding-bottom: ${space(4)};
`;

Modal.defaultProps = {
  initial: {opacity: 0, y: -10},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: 15},
  transition: testableTransition({
    opacity: {duration: 0.2},
    y: {duration: 0.25},
  }),
};

const Content = styled('div')`
  padding: ${space(4)};
  background: ${p => p.theme.background};
  border-radius: 8px;
  border: 1px solid ${p => p.theme.modalBorder};
`;

type State = {
  modalStore: ReturnType<typeof ModalStore.get>;
};

class GlobalModalContainer extends React.Component<Partial<Props>, State> {
  state: State = {
    modalStore: ModalStore.get(),
  };

  componentDidMount() {
    // Listen for route changes so we can dismiss modal
    this.unlistenBrowserHistory = browserHistory.listen(() => actionCloseModal());
  }

  componentWillUnmount() {
    this.unlistenBrowserHistory?.();
    this.unlistener?.();
  }

  unlistener = ModalStore.listen(
    (modalStore: State['modalStore']) => this.setState({modalStore}),
    undefined
  );

  unlistenBrowserHistory?: ReturnType<typeof browserHistory.listen>;

  render() {
    const {modalStore} = this.state;
    const visible = !!modalStore && typeof modalStore.renderer === 'function';

    return (
      <GlobalModal {...this.props} {...modalStore} visible={visible}>
        {visible ? modalStore.renderer : null}
      </GlobalModal>
    );
  }
}

export default GlobalModalContainer;
