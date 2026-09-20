import React from 'react';

export const OrderNumberField = ({ orders, value, onChange, required = false, className = '' }) => (
  <div className={`form-group ${className}`.trim()}>
    <label>Order No{required ? ' *' : ''}</label>
    <input
      type="text"
      className="form-control"
      list="fabric-order-numbers"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder="Type or select an order number"
      required={required}
    />
    <datalist id="fabric-order-numbers">
      {orders.map(order => <option key={order.orderId} value={order.orderNo} />)}
    </datalist>
  </div>
);