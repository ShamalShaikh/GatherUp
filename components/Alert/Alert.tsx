'use client';

import { useEffect } from 'react';

// hooks
import useAlert from '@hooks/useAlert';

// components
import Progress from '@components/Progress/Progress';

const Alert: React.FC = () => {
  const { alert, hideAlert } = useAlert();

  useEffect(() => {
    // Set timeout based on alert type - 1 second for success alerts, 7 seconds for others
    const timeoutDuration = alert.type === 'success' ? 1000 : 7000;
    
    const timeout = setTimeout(() => {
      hideAlert();
    }, timeoutDuration);

    return () => {
      clearTimeout(timeout);
    };
    // Only depend on hideAlert to keep the dependency array consistent
  }, [hideAlert]);

  if (alert.show === true) {
    return (
      <div className='main-menu-backdrop'>
        <div className={`alert ${alert.type}`}>
          <div className='container'>
            <p>{alert.text}</p>
            <button type='button' onClick={hideAlert}>
              <span className='material-symbols-outlined'>close</span>
            </button>
          </div>
          {/* Set Progress duration based on alert type */}
          <Progress ms={alert.type === 'success' ? 1000 : 7000} />
        </div>
      </div>
    );
  }

  return <></>;
};

export default Alert;
