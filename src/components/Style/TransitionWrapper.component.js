import React, { useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './TransitionWrapper.component.css';

const TransitionWrapperComponent = ({ children, location }) => {
    const nodeRef = useRef(null);

    return (
        <TransitionGroup>
            <CSSTransition
                key={location.key}
                nodeRef={nodeRef}
                classNames="fade"
                timeout={100}
            >
                <div ref={nodeRef}>
                    {children}
                </div>
            </CSSTransition>
        </TransitionGroup>
    );
};

export default TransitionWrapperComponent;
