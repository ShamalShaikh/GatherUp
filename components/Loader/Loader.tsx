import React from 'react';
import styles from './Loader.module.css';

// interfaces
interface IProps {
  type?: string;
  color?: string;
  text?: string;
}

const Loader: React.FC<IProps> = ({ type = 'fullscreen', color = 'blue', text }) => {
  if (type === 'inline') {
    return (
      <div className={`${styles.loading} ${styles.inline} ${styles[color]}`}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingIcon}>
            <span className='material-symbols-outlined'>refresh</span>
          </div>
          {text && <p>{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.loading} ${styles.fullscreen} ${styles[color]}`}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingIcon}>
          <span className='material-symbols-outlined'>refresh</span>
        </div>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
};

export default Loader;
