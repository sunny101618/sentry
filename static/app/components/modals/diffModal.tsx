import React from 'react';
import {css} from '@emotion/react';

import {ModalRenderProps} from 'app/actionCreators/modal';
import IssueDiff from 'app/components/issueDiff';

type Props = ModalRenderProps & React.ComponentProps<typeof IssueDiff>;

const DiffModal = ({className, Body, ...props}: Props) => (
  <Body>
    <IssueDiff className={className} {...props} />
  </Body>
);

const modalCss = css`
  display: flex;
  margin: 0;
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  bottom: 10px;
  width: auto;

  .modal-content {
    display: flex;
    flex: 1;
  }
  .modal-body {
    display: flex;
    overflow: hidden;
    flex: 1;
  }
`;

export {modalCss};

export default DiffModal;
