import React, { useState } from 'react';
import useTimer from '../components/TestElement';

const TimerDisplay = ({ days, hours, minutes, seconds, isRunning }) => (
  <div style={{ fontSize: '2rem', fontFamily: 'monospace' }}>
    {String(days).padStart(2, '0')}д : {String(hours).padStart(2, '0')}ч :{' '}
    {String(minutes).padStart(2, '0')}м : {String(seconds).padStart(2, '0')}с
    <span>{isRunning ? ' ▶️' : ' ⏸️'}</span>
  </div>
);

const App = () => {
  const [showTimer, setShowTimer] = useState(true);
  
  // Таймер живёт на уровне App, его состояние не теряется при скрытии UI
  const timer = useTimer(90, () => alert('Время вышло!')); // 90 секунд = 1:30

  return (
    <div>
      <button onClick={() => setShowTimer(!showTimer)}>
        {showTimer ? 'Спрятать' : 'Показать'} таймер
      </button>

      {/* UI таймера можно показывать условно — состояние не сбросится */}
      {showTimer && (
        <div>
          <TimerDisplay {...timer} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={timer.start}>Запустить</button>
            <button onClick={timer.stop}>Остановить</button>
            <button onClick={timer.reset}>Сбросить</button>
          </div>
        </div>
      )}

      {/* Кнопки управления могут быть всегда доступны, даже когда таймер скрыт */}
      <div style={{ marginTop: '20px' }}>
        <p>Управление всегда активно:</p>
        <button onClick={timer.start}>▶ Старт (везде)</button>
        <button onClick={timer.stop}>⏹ Стоп (везде)</button>
        <button onClick={timer.reset}>🔄 Сброс (везде)</button>
      </div>
    </div>
  );
};

export default App;