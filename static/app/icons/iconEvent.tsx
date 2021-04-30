import * as React from 'react';

import SvgIcon from './svgIcon';

type Props = React.ComponentProps<typeof SvgIcon>;

const IconEvent = React.forwardRef(function IconEvent(
  props: Props,
  ref: React.Ref<SVGSVGElement>
) {
  return (
    <SvgIcon {...props} ref={ref}>
      <path d="M8,9.86a.79.79,0,0,1-.37-.1L.38,5.58A.73.73,0,0,1,0,4.93a.75.75,0,0,1,.38-.64L7.61.11a.77.77,0,0,1,.75,0l7.23,4.18a.75.75,0,0,1,0,1.29L8.36,9.76A.86.86,0,0,1,8,9.86ZM2.25,4.93,8,8.24l5.73-3.31L8,1.63Z" />
      <path d="M8,16a.82.82,0,0,1-.37-.1l-.87-.5a.75.75,0,0,1-.27-1,.74.74,0,0,1,1-.27l.87.5a.74.74,0,0,1,.27,1A.76.76,0,0,1,8,16Z" />
      <path d="M5.05,14.3a.86.86,0,0,1-.37-.1l-1.37-.8a.74.74,0,0,1-.28-1,.76.76,0,0,1,1-.28l1.37.8a.75.75,0,0,1-.38,1.4Z" />
      <path d="M1.62,12.31a.75.75,0,0,1-.38-.1l-.86-.5a.75.75,0,1,1,.75-1.29l.86.5a.74.74,0,0,1-.37,1.39Z" />
      <path d="M14.35,12.31A.75.75,0,0,1,14,10.92l.87-.5a.75.75,0,0,1,.75,1.29l-.87.5A.74.74,0,0,1,14.35,12.31Z" />
      <path d="M10.91,14.3a.76.76,0,0,1-.65-.38.74.74,0,0,1,.28-1l1.37-.8a.75.75,0,0,1,1,.28.74.74,0,0,1-.27,1l-1.37.8A.86.86,0,0,1,10.91,14.3Z" />
      <path d="M8,16a.75.75,0,0,1-.37-1.4l.86-.5a.75.75,0,1,1,.75,1.3l-.86.5A.86.86,0,0,1,8,16Z" />
      <path d="M.75,11.82A.75.75,0,0,1,0,11.07V9.94a.75.75,0,0,1,1.5,0v1.13A.74.74,0,0,1,.75,11.82Zm0-4.13A.75.75,0,0,1,0,6.94v-2a.75.75,0,0,1,1.5,0v2A.74.74,0,0,1,.75,7.69Z" />
      <path d="M15.25,11.82a.74.74,0,0,1-.75-.75V9.94a.75.75,0,1,1,1.5,0v1.13A.75.75,0,0,1,15.25,11.82Zm0-4.13a.74.74,0,0,1-.75-.75v-2a.75.75,0,0,1,1.5,0v2A.75.75,0,0,1,15.25,7.69Z" />
    </SvgIcon>
  );
});

IconEvent.displayName = 'IconEvent';

export {IconEvent};
