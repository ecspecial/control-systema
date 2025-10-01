import type { FC } from 'react';
import { ObjectList } from '../ObjectList/ObjectList';
import styles from './ObjectsPage.module.scss';

export const ObjectsPage: FC = () => {
  return (
    <div className={styles.page}>
      <ObjectList />
    </div>
  );
};
