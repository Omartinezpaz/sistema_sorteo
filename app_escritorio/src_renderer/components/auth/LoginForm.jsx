import React, { useState } from 'react';
import './LoginForm.css'; // Crearemos este archivo CSS después

function LoginForm({ onLogin, loginError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Aquí iría la lógica de validación real
    // Por ahora, solo llamamos a onLogin con los datos
    if (onLogin) {
      onLogin({ username, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Iniciar Sesión</h2>
      {loginError && <p className="login-error-message">{loginError}</p>}
      <div className="form-group">
        <label htmlFor="username">Usuario:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Contraseña:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="login-button">Ingresar</button>
    </form>
  );
}

export default LoginForm; 