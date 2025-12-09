import React, { useState, useEffect, useRef } from 'react';
import styles from './Wizard.module.css'; // Reuse wizard styles
import { useAuth } from '../../context/AuthContext';
import allCareers from '../../data/all_careers.json';

interface UserDetailsFormProps {
    onSubmit: (details: { name: string; age: string; profession: string }) => void;
    initialData: { name: string; age: string; profession: string };
}

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ onSubmit, initialData }) => {
    const { currentUser } = useAuth();
    const [name, setName] = useState(initialData.name);
    const [age, setAge] = useState(initialData.age);
    const [profession, setProfession] = useState(initialData.profession);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-fill name if logged in and not already set
        if (currentUser?.displayName && !name) {
            setName(currentUser.displayName);
        }
    }, [currentUser, name]);

    useEffect(() => {
        // Handle clicking outside suggestions
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleProfessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setProfession(value);

        if (value.length > 1) {
            const filtered = allCareers.filter(c =>
                c.title.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (title: string) => {
        setProfession(title);
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, age, profession });
    };

    return (
        <div className={styles.wizardContainer}>
            <div className={styles.header}>
                <h2>Let's Get to Know You</h2>
                <p>We'll use this to personalize your career insights.</p>
            </div>
            <div className={styles.questionCard} style={{ textAlign: 'center', padding: '3rem' }}>
                <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>

                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                        <label className={styles.inputLabel}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.inputField}
                            placeholder="e.g. Adarsh"
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                        <label className={styles.inputLabel}>Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className={styles.inputField}
                            placeholder="e.g. 25"
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem', textAlign: 'left', position: 'relative' }} ref={wrapperRef}>
                        <label className={styles.inputLabel}>Target Profession / Career Interest</label>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Select from the list for accurate role fit analysis.</p>
                        <input
                            type="text"
                            value={profession}
                            onChange={handleProfessionChange}
                            onFocus={() => profession.length > 1 && setShowSuggestions(true)}
                            className={styles.inputField}
                            placeholder="Type to search roles (e.g. Engineer)"
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            autoComplete="off"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                margin: '0.5rem 0 0 0',
                                padding: 0,
                                listStyle: 'none'
                            }}>
                                {suggestions.map((s, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => handleSuggestionClick(s.title)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            color: '#334155',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        {s.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Start Assessment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserDetailsForm;
