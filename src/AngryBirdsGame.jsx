import { useEffect, useRef, useState } from "react"

const AngryBirdsGame = () => {
  const [birdPosition, setBirdPosition] = useState({ x: 200, y: 400 }); // Moved bird more to right
  const [birdVelocity, setBirdVelocity] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [shotsLeft, setShotsLeft] = useState(3);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [objects, setObjects] = useState([]);
  const animationRef = useRef();

  const audioRef = useRef(new Audio('https://kappa.vgmsite.com/soundtracks/angry-birds/mskxllhbbp/25.%20Main%20Theme.mp3'));

  // Add this useEffect for audio control
useEffect(() => {
  audioRef.current.loop = true;
  
  const playAudio = () => {
    audioRef.current.play().catch(e => console.log('Audio play failed:', e));
  };

  // Play on user interaction
  document.addEventListener('click', playAudio, { once: true });

  return () => {
    audioRef.current.pause();
    document.removeEventListener('click', playAudio);
  };
}, []);

  // Generate level-specific layouts
  const generateLevelLayout = (level) => {
    const targets = [];
    const obstacles = [];
    
    // Different layouts for each level
    switch(level) {
      case 0:
        // Tutorial level - simple layout
        targets.push(
          { id: 't1', x: 700, y: 400, isHit: false },
          { id: 't2', x: 800, y: 400, isHit: false },
          { id: 't3', x: 750, y: 300, isHit: false }
        );
        obstacles.push(
          { id: 'o1', x: 650, y: 400, type: 'wood', isHit: false },
          { id: 'o2', x: 650, y: 350, type: 'glass', isHit: false }
        );
        break;
      case 1:
        // Pyramid formation
        targets.push(
          { id: 't1', x: 750, y: 400, isHit: false },
          { id: 't2', x: 700, y: 350, isHit: false },
          { id: 't3', x: 800, y: 350, isHit: false },
          { id: 't4', x: 750, y: 300, isHit: false }
        );
        obstacles.push(
          { id: 'o1', x: 650, y: 400, type: 'wood', isHit: false },
          { id: 'o2', x: 850, y: 400, type: 'wood', isHit: false },
          { id: 'o3', x: 750, y: 250, type: 'glass', isHit: false }
        );
        break;
      case 2:
        // Two towers
        targets.push(
          { id: 't1', x: 600, y: 400, isHit: false },
          { id: 't2', x: 600, y: 300, isHit: false },
          { id: 't3', x: 800, y: 400, isHit: false },
          { id: 't4', x: 800, y: 300, isHit: false }
        );
        obstacles.push(
          { id: 'o1', x: 600, y: 350, type: 'glass', isHit: false },
          { id: 'o2', x: 800, y: 350, type: 'wood', isHit: false },
          { id: 'o3', x: 700, y: 400, type: 'wood', isHit: false }
        );
        break;
      default:
        // Random generated levels for higher levels
        const baseCount = 3 + Math.floor(level / 2);
        for (let i = 0; i < baseCount; i++) {
          targets.push({
            id: `t${i}`,
            x: 600 + Math.random() * 300,
            y: 200 + Math.random() * 250,
            isHit: false
          });
        }
        for (let i = 0; i < baseCount - 1; i++) {
          obstacles.push({
            id: `o${i}`,
            x: 550 + Math.random() * 350,
            y: 200 + Math.random() * 250,
            type: Math.random() > 0.5 ? 'wood' : 'glass',
            isHit: false
          });
        }
    }
    return { targets, obstacles };
  };

  // Initialize level
  useEffect(() => {
    const layout = generateLevelLayout(level);
    setTargets(layout.targets);
    setObjects(layout.obstacles);
  }, [level]);

  const [targets, setTargets] = useState([]);

  const calculateTrajectory = (startX, startY, velocityX, velocityY) => {
    const points = [];
    const gravity = 0.5;
    const steps = 30;
    let x = startX;
    let y = startY;
    let vx = velocityX;
    let vy = velocityY;

    for (let i = 0; i < steps; i++) {
      points.push({ x, y });
      x += vx;
      y += vy;
      vy += gravity;
    }

    return points;
  };

  const handleMouseDown = (e) => {
    if (!gameStarted && shotsLeft > 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const maxDrag = 200; // Increased max drag distance
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance > maxDrag ? maxDrag / distance : 1;
      
      const newX = 200 + dx * scale; // Updated starting position
      const newY = 400 + dy * scale;
      
      setBirdPosition({
        x: newX,
        y: newY
      });

      const velocityX = -(newX - 200) * 0.2;
      const velocityY = -(newY - 400) * 0.2;
      const trajectoryPoints = calculateTrajectory(newX, newY, velocityX, velocityY);
      setTrajectoryPoints(trajectoryPoints);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const dx = birdPosition.x - 200; // Updated starting position
      const dy = birdPosition.y - 400;
      
      setBirdVelocity({
        x: -dx * 0.2,
        y: -dy * 0.2
      });
      
      setIsDragging(false);
      setGameStarted(true);
      setShotsLeft(prev => prev - 1);
      setTrajectoryPoints([]);
    }
  };

  const checkCollision = (x1, y1, x2, y2) => {
    const distance = Math.sqrt(
      Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
    );
    return distance < 40;
  };

  // Handle object physics
  const handleObjectPhysics = (object, birdX, birdY) => {
    if (!object.isHit) {
      const dx = object.x - birdX;
      const dy = object.y - birdY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 40) {
        const force = object.type === 'glass' ? 2 : 1;
        return {
          ...object,
          isHit: true,
          velocityX: (dx / distance) * 10 * force,
          velocityY: (dy / distance) * 10 * force - 5
        };
      }
    } else if (object.velocityX || object.velocityY) {
      return {
        ...object,
        x: object.x + object.velocityX,
        y: object.y + object.velocityY,
        velocityY: object.velocityY + 0.5,
        velocityX: object.velocityX * 0.99
      };
    }
    return object;
  };

  useEffect(() => {
    const updateGame = () => {
      if (gameStarted) {
        setBirdPosition(prev => ({
          x: prev.x + birdVelocity.x,
          y: prev.y + birdVelocity.y
        }));
        
        setBirdVelocity(prev => ({
          x: prev.x * 0.99,
          y: prev.y * 0.99 + 0.5
        }));

        // Update objects and check for collisions
        setObjects(prev => {
          const updatedObjects = prev.map(obj => handleObjectPhysics(obj, birdPosition.x, birdPosition.y));
          
          // Check if flying objects hit targets
          updatedObjects.forEach(obj => {
            if (obj.isHit && (obj.velocityX || obj.velocityY)) {
              setTargets(prevTargets => 
                prevTargets.map(target => {
                  if (!target.isHit && checkCollision(obj.x, obj.y, target.x, target.y)) {
                    setScore(s => s + 100);
                    return { ...target, isHit: true };
                  }
                  return target;
                })
              );
            }
          });
          
          return updatedObjects;
        });

        // Check direct bird hits on targets
        setTargets(prev => 
          prev.map(target => {
            if (!target.isHit && checkCollision(birdPosition.x, birdPosition.y, target.x, target.y)) {
              setScore(s => s + 100);
              return { ...target, isHit: true };
            }
            return target;
          })
        );

        // Check if level is complete or failed
        const allTargetsHit = targets.every(t => t.isHit);
        const outOfBounds = birdPosition.y > 600 || birdPosition.x > 1000 || birdPosition.x < 0;
        
        if (outOfBounds) {
          if (shotsLeft === 0 && !allTargetsHit) {
            const unhitTargets = targets.filter(t => !t.isHit).length;
            setScore(s => Math.max(0, s - (targets.length * 50))); // Deduct 50 points per unhit target

            const layout = generateLevelLayout(level);
            setTargets(layout.targets);
            setObjects(layout.obstacles);
            setBirdPosition({ x: 200, y: 400 });
            setBirdVelocity({ x: 0, y: 0 });
            setGameStarted(false);
            setShotsLeft(3);
          } else {
            setGameStarted(false);
            setBirdPosition({ x: 200, y: 400 });
            setBirdVelocity({ x: 0, y: 0 });
          }
        }

        if (allTargetsHit) {
          // level cleared
          setTimeout(() => {
            const nextLevel = level + 1;  // Store the next level value
            setLevel(nextLevel);
            setBirdPosition({ x: 200, y: 400 });
            setBirdVelocity({ x: 0, y: 0 });
            setGameStarted(false);
            setShotsLeft(3);
            const newLayout = generateLevelLayout(nextLevel);  // Use nextLevel instead of level + 1
            setTargets(newLayout.targets);
            setObjects(newLayout.obstacles);
          }, 2000);
        }
      }
      animationRef.current = requestAnimationFrame(updateGame);
    };

    animationRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameStarted, birdVelocity, targets]);

  return (
    <div className="relative w-full h-screen bg-blue-100 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}

      style={{
        backgroundImage: "url('https://i.pinimg.com/originals/2c/24/ba/2c24ba2e0e1a2455cccc366a96efcbf0.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <h1 className="text-center pt-4 text-2xl">Angry Birds Game</h1>

      <div className="absolute top-4 left-4 space-y-2">
        <div className="text-2xl font-bold">Level: {level}</div>
        <div className="text-2xl font-bold">Score: {score}</div>
        <div className="text-2xl font-bold">Shots Left: {shotsLeft}</div>
      </div>

      {/* trajectory */}
      {isDragging && trajectoryPoints.map((point, index) => (
        <div 
          key={index}
          className="absolute w-1 h-1 bg-gray-400 rounded-full"
          style={{
            left: point.x,
            top: point.y,
            opacity: 1 - (index / trajectoryPoints.length),
          }}
        />
      ))}

      {/* bird */}
      <div 
        className={`absolute w-8 h-8 rounded-full cursor-pointer
          ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }
        `}
        style={{
          left: birdPosition.x,
          top: birdPosition.y,
          transform: 'translate(-50%, -50%)',
          backgroundImage: "url('https://static.wikia.nocookie.net/angrybirdsfanon/images/9/9b/20190923_110954.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '50px',
          height: '50px'
        }}

        onMouseDown={handleMouseDown}
        ></div>

        {/* targets */}
        {targets.map((target) => (
          <div 
            key={target.id}
          className={`absolute w-10 h-10 rounded-full ${
            target.isHit ? 'opacity-50' : ''
          }`}
          style={{
            left: target.x,
            top: target.y,
            transform: 'translate(-50%, -50%)',
            backgroundImage: target.isHit 
                ? "url('https://static.wikia.nocookie.net/angrybirds/images/2/20/Pig_scared_3.png')"
                : "url('https://static.wikia.nocookie.net/angrybirds/images/0/0a/Piggy_medium.png')",
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              width: '50px',
              height: '50px'
          }}>          
          </div>
        ))}

        {/* objects */}
        {objects.map((object) => (
          <div 
            key={object.id}
          className={`absolute w-12 h-12 
            ${
              object.type === 'wood' ? 'bg-yellow-800' : 'bg-blue-200 bg-opacity-50'
            }
          `}
          style={{
            left: object.x,
            top: object.y,
            transform: 'translate(-50%, -50%)'          
          }}>            
          </div>
        ))}


        {/* Instructions */}
      {!gameStarted && !isDragging && shotsLeft > 0 && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-xl font-bold mb-4">Level {level}</p>
          <p className="mb-2">Drag the bird to launch!</p>
          <p>Hit all targets to advance</p>
          {level === 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p>💡 Tip: Use wood and glass objects to hit multiple targets!</p>
              <p>🎯 Wood blocks move slower but are more sturdy</p>
              <p>✨ Glass shatters easily but flies faster</p>
            </div>
          )}
        </div>
      )}

      {/* Level Complete Message */}
      {targets.every(t => t.isHit) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Level Complete!</h2>
          <p className="mb-4">Moving to Level {level + 1}</p>
        </div>
      )}
    </div>
  )
}

export default AngryBirdsGame
