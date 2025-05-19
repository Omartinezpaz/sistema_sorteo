import React from 'react';
import LoginForm from '../../components/auth/LoginForm';

function LoginPage({ onLogin, loginError }) {
  return (
    <div className="login-page-container">
      <LoginForm onLogin={onLogin} loginError={loginError} />
    </div>
  );
}

export default LoginPage; 