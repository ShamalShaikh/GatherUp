import React from 'react';
import styles from './Spinner.module.css';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'blue', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: styles.spinnerSm,
    md: styles.spinnerMd,
    lg: styles.spinnerLg
  };

  const colorClasses = {
    blue: styles.blue,
    red: styles.red,
    orange: styles.orange,
    gray: styles.gray,
    white: styles.white
  };

  return (
    <div className={`${styles.spinnerContainer} ${className}`}>
      <div 
        className={`${styles.spinner} ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
      >
        <span className="material-symbols-outlined">refresh</span>
      </div>
    </div>
  );
};

export default Spinner; 