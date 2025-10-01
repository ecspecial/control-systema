import { useState } from 'react';
import type { FC } from 'react';
import Select from 'react-select';
import { ObjectStatus, ObjectStatusDisplay } from '../../../types/city-object.types';
import styles from './ObjectFilters.module.scss';

interface Option {
  value: ObjectStatus | 'all';
  label: string;
}

interface ObjectFiltersProps {
  onFilterChange: (status: ObjectStatus | 'all') => void;
}

export const ObjectFilters: FC<ObjectFiltersProps> = ({ onFilterChange }) => {
  const options: Option[] = [
    { value: 'all', label: 'Все объекты' },
    ...Object.entries(ObjectStatus).map(([key, value]) => ({
      value: value,
      label: ObjectStatusDisplay[value]
    }))
  ];

  return (
    <div className={styles.filters}>
      <Select
        className={styles.select}
        options={options}
        defaultValue={options[0]}
        onChange={(option) => option && onFilterChange(option.value)}
        isSearchable={false}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 42,
            borderColor: '#dee2e6',
            borderRadius: '8px',
            boxShadow: 'none',
            '&:hover': {
              borderColor: '#adb5bd'
            },
            '&:focus-within': {
              borderColor: '#0d6efd',
              boxShadow: '0 0 0 3px rgba(13, 110, 253, 0.15)'
            }
          }),
          option: (base, state) => ({
            ...base,
            padding: '10px 16px',
            backgroundColor: state.isSelected 
              ? '#0d6efd' 
              : state.isFocused 
                ? '#f8f9fa' 
                : 'white',
            color: state.isSelected ? 'white' : '#495057',
            cursor: 'pointer',
            '&:active': {
              backgroundColor: state.isSelected ? '#0d6efd' : '#e9ecef'
            },
            '&:first-of-type': {
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            },
            '&:last-of-type': {
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
            }
          }),
          menu: (base) => ({
            ...base,
            marginTop: 4,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            '::-webkit-scrollbar': {
              width: '8px'
            },
            '::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px'
            },
            '::-webkit-scrollbar-thumb': {
              background: '#ccc',
              borderRadius: '4px',
              '&:hover': {
                background: '#bbb'
              }
            }
          }),
          valueContainer: (base) => ({
            ...base,
            padding: '2px 16px'
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: '#495057',
            '&:hover': {
              color: '#212529'
            }
          }),
          indicatorSeparator: () => ({
            display: 'none'
          })
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: '#0d6efd',
            primary25: '#f8f9fa',
            primary50: '#e9ecef',
            primary75: '#0d6efd'
          },
          borderRadius: 8
        })}
      />
    </div>
  );
};
