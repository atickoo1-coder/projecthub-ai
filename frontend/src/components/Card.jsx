import React from 'react';

const Card = ({ children, className = '', title, subtitle, action, ...props }) => {
  return (
    <div 
      {...props}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex justify-between items-center mb-6">
          <div>
            {title && <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
