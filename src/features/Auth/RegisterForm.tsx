import React, {useState} from 'react';
import {registerUser} from '../../services/api.ts';

export const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const data = await registerUser(email, password);
            if (data) {
                setMessage('Регистрация прошла успешно! Письмо с подтверждением отправлено на почту.');
            } else {
                setError('Не удалось зарегистрироваться. Возможно, этот email уже занят или пароль слишком простой.');
            }
        } catch (err) {
            setError('Произошла ошибка при соединении с сервером.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            maxWidth: '400px',
            margin: '40px auto',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px'
        }}>
            <h2>Регистрация аккаунта</h2>
            <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px'}}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}
                    />
                </div>
                <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px'}}>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{width: '100%', padding: '8px', boxSizing: 'border-box'}}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#007BFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>

            {message && <p style={{color: 'green', marginTop: '15px'}}>{message}</p>}
            {error && <p style={{color: 'red', marginTop: '15px'}}>{error}</p>}
        </div>
    );
};