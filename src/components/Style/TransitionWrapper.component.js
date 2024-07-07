import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './TransitionWrapper.component.css';

const TransitionWrapperComponent = ({ children, location }) => {
    return (
        <TransitionGroup>
            <CSSTransition
                key={location.key}
                classNames="fade"
                timeout={300}
            >
                {children}
            </CSSTransition>
        </TransitionGroup>
    );
};

export default TransitionWrapperComponent;
