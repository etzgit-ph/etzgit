import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...rest }) => {
  const style = {
    padding: '8px 12px',
    borderRadius: 6,
    background: variant === 'primary' ? '#0b5cff' : '#eee',
    color: variant === 'primary' ? '#fff' : '#111',
    border: 'none',
  } as React.CSSProperties;
  return (
    // eslint-disable-next-line react/button-has-type
    <button style={style} {...rest}>
      {children}
    </button>
  );
};
