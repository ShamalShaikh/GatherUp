import React from 'react';
import styles from './CategoryButton.module.css';

interface CategoryButtonProps {
  icon: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ icon, text, isSelected, onClick }) => (
  <button
    type='button'
    className={`${styles.categoryButton} ${isSelected ? styles.categorySelected : ''}`}
    onClick={onClick}
    aria-pressed={isSelected}
    aria-label={`${text} category ${isSelected ? 'selected' : ''}`}
  >
    <span className='material-symbols-outlined'>{icon}</span>
    <span className={styles.categoryText}>{text}</span>
  </button>
);

export default CategoryButton;
