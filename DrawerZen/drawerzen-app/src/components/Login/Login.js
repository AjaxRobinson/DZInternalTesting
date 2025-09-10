import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const LoginForm = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: green;
  margin-bottom: 1rem;
  text-align: center;
`;

const ToggleButton = styled.button`
  background: none;
  color: #007bff;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
  text-align: center;
`;

const ForgotPasswordLink = styled.button`
  background: none;
  color: #007bff;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 0.5rem;
  width: 100%;
  text-align: center;
  font-size: 0.9rem;
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [address, setAddress] = useState('');

  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('Password reset email sent! Check your inbox.');
      } else if (isSignUp) {
        const { error } = await signUp(email, password, displayName, address);
        if (error) throw error;
        setSuccess('Check your email for confirmation!');
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsSignUp(false);
    setError('');
    setSuccess('');
    setAddress('');
  };

  if (isForgotPassword) {
    return (
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit}>
          <h2>Reset Password</h2>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <FormGroup>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          
          <ToggleButton type="button" onClick={handleBackToLogin}>
            Back to Sign In
          </ToggleButton>
        </LoginForm>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {isSignUp && (
          <FormGroup>
            <Input
              type="text"
              placeholder="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required={isSignUp}
            />
          </FormGroup>
        )}
        {isSignUp && (
  <FormGroup>
    <Input
      type="text"
      placeholder="Address"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      required={isSignUp}
    />
  </FormGroup>
)}

        <FormGroup>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormGroup>

        
          <FormGroup>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isSignUp}
            />
          </FormGroup>
        

        {!isSignUp && (
          <ForgotPasswordLink 
            type="button" 
            onClick={() => setIsForgotPassword(true)}
          >
            Forgot Password?
          </ForgotPasswordLink>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </Button>

        <ToggleButton type="button" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </ToggleButton>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;