import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';

import ToolContextMenu from '../../../viewer/src/connectedComponents/ToolContextMenu';

import { useDialog } from './DialogProvider';
import { useLabellingFlow } from './LabellingFlowProvider';

const ContextMenuContext = createContext(null);
const { Provider } = ContextMenuContext;

export const useContextMenu = () => useContext(ContextMenuContext);

const ContextMenuProvider = ({ children, service }) => {
  const { create, dismiss } = useDialog();
  const { show: showLabellingFlow } = useLabellingFlow();

  /**
   * Sets the implementation of a context menu service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        show,
        hide,
      });
    }
  }, [hide, service, show]);

  const hide = useCallback(() => dismiss({ id: 'context-menu' }), [dismiss]);

  /**
   * Show the context menu and override its configuration props.
   *
   * @param {ContextMenuProps} props { eventData, isTouchEvent, onClose, visible }
   * @returns void
   */
  const show = useCallback(
    ({ event }) => {
      hide();
      create({
        id: 'context-menu',
        isDraggable: false,
        useLastPosition: false,
        content: ToolContextMenu,
        contentProps: {
          eventData: event,
          onClose: () => dismiss({ id: 'context-menu' }),
          onSetLabel: (eventData, measurementData) =>
            showLabellingFlow({
              event: eventData,
              centralize: true,
              props: {
                measurementData,
                skipAddLabelButton: true,
                editLocation: true,
              },
            }),
          onSetDescription: (eventData, measurementData) =>
            showLabellingFlow({
              event: eventData,
              centralize: false,
              defaultPosition: _getDefaultPosition(eventData),
              props: {
                measurementData,
                editDescriptionOnDialog: true,
              },
            }),
        },
        defaultPosition: _getDefaultPosition(event),
      });
    },
    [create, dismiss, hide, showLabellingFlow]
  );

  const _getDefaultPosition = event => ({
    x: (event && event.currentPoints.client.x) || 0,
    y: (event && event.currentPoints.client.y) || 0,
  });

  return (
    <Provider
      value={{
        show,
        hide,
      }}
    >
      {children}
    </Provider>
  );
};

/**
 * Higher Order Component to use the context menu methods through a Class Component.
 *
 * @returns
 */
export const withContextMenu = Component => {
  return function WrappedComponent(props) {
    const { show, hide } = useContextMenu();
    return (
      <Component
        {...props}
        modal={{
          show,
          hide,
        }}
      />
    );
  };
};

ContextMenuProvider.defaultProps = {
  service: null,
};

ContextMenuProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

export default ContextMenuProvider;

export const ContextMenuConsumer = ContextMenuContext.Consumer;
