// Connect to the server
const socket = io();

// Get the canvas element and its 2D context
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

// Get all DOM elements for the toolbar
const penButton = document.getElementById('pen');
const eraserButton = document.getElementById('eraser');
const colorPicker = document.getElementById('color-picker');
const shapesButton = document.getElementById('shapes');
const fillToolButton = document.getElementById('fill-tool');
const toolSize = document.getElementById('tool-size');
const sizeValue = document.getElementById('size-value');
const shapesContainer = document.getElementById('shapes-container');
const clearButton = document.getElementById('clear');

// --- STATE MANAGEMENT ---
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let currentThickness = 5;
let currentShape = null;

// Coordinates and canvas snapshot
let startX, startY;
let canvasSnapshot;

// --- CANVAS SETUP & RESIZING ---
function resizeCanvas() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Ensure background stays white after resizing (fills new areas)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial size set

// --- LOCAL STORAGE ---
function saveDrawing() {
    localStorage.setItem('whiteboard', canvas.toDataURL());
}

function loadDrawing() {
    const savedDrawing = localStorage.getItem('whiteboard');
    if (savedDrawing) {
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        };
        img.src = savedDrawing;
    } else {
        // No saved drawing; initialize with a white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
setInterval(saveDrawing, 2000);
window.addEventListener('beforeunload', saveDrawing);
loadDrawing();

// --- CORE DRAWING FUNCTIONS ---
function draw(data) {
    const { x1, y1, x2, y2, color, thickness, tool, shape } = data;

    if (tool === 'pen' || tool === 'eraser') {
        ctx.beginPath();
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    } else if (tool === 'shapes' && shape) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        
        const width = x2 - x1;
        const height = y2 - y1;

        switch(shape) {
            case 'rectangle':
                ctx.strokeRect(x1, y1, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
                ctx.arc(x1, y1, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'line':
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                break;
        }
        ctx.closePath();
    }
}

// --- MOUSE EVENT LISTENERS ---
// Enhanced flood fill algorithm with border detection
function floodFill(x, y, targetColor, fillColor) {
    // Get the pixel data at the clicked point
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Convert coordinates to pixel index
    const getIndex = (x, y) => (y * width + x) * 4;
    
    // Get the color at the clicked point
    const clickedIndex = getIndex(Math.round(x), Math.round(y));
    const targetR = pixels[clickedIndex];
    const targetG = pixels[clickedIndex + 1];
    const targetB = pixels[clickedIndex + 2];
    const targetA = pixels[clickedIndex + 3];
    
    // If the clicked color is the same as the fill color, do nothing
    if (targetR === fillColor.r && targetG === fillColor.g && 
        targetB === fillColor.b && targetA === fillColor.a) {
        return;
    }
    
    // Create a stack for the flood fill and a Set to track visited pixels
    const stack = [{x: Math.round(x), y: Math.round(y)}];
    const visited = new Set();
    
    // Helper function to check if a pixel should be filled
    const shouldFill = (x, y) => {
        // Check bounds
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        
        // Check if already visited
        const index = getIndex(x, y);
        if (visited.has(`${x},${y}`)) return false;
        
        // Check if pixel matches the target color (with some tolerance for anti-aliasing)
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const a = pixels[index + 3];
        
        // If it's a transparent pixel, treat it as white
        if (a < 10) {
            return true;
        }
        
        // Calculate color difference (simple Euclidean distance in RGBA space)
        const dr = r - targetR;
        const dg = g - targetG;
        const db = b - targetB;
        const da = a - targetA;
        const distance = Math.sqrt(dr*dr + dg*dg + db*db + da*da);
        
        // Use a threshold to determine if colors are similar (higher to handle anti-aliased borders)
        return distance < 60; // increased tolerance to reduce gaps near edges
    };
    
    // Process the stack
    while (stack.length > 0) {
        const {x, y} = stack.pop();
        const index = getIndex(x, y);
        
        // Skip if out of bounds or already visited
        if (x < 0 || x >= width || y < 0 || y >= height || visited.has(`${x},${y}`)) {
            continue;
        }
        
        // Mark as visited
        visited.add(`${x},${y}`);
        
        // Set the new color
        pixels[index] = fillColor.r;
        pixels[index + 1] = fillColor.g;
        pixels[index + 2] = fillColor.b;
        pixels[index + 3] = fillColor.a;
        
        // Add adjacent pixels to the stack if they should be filled (8-directional)
        if (shouldFill(x + 1, y)) stack.push({x: x + 1, y});
        if (shouldFill(x - 1, y)) stack.push({x: x - 1, y});
        if (shouldFill(x, y + 1)) stack.push({x, y: y + 1});
        if (shouldFill(x, y - 1)) stack.push({x, y: y - 1});
        if (shouldFill(x + 1, y + 1)) stack.push({x: x + 1, y: y + 1});
        if (shouldFill(x - 1, y + 1)) stack.push({x: x - 1, y: y + 1});
        if (shouldFill(x + 1, y - 1)) stack.push({x: x + 1, y: y - 1});
        if (shouldFill(x - 1, y - 1)) stack.push({x: x - 1, y: y - 1});
    }
    
    // Update the canvas with the filled pixels
    ctx.putImageData(imageData, 0, 0);
    saveDrawing();
}

// Convert hex color to RGB
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return {r, g, b, a: 255};
}

canvas.addEventListener('mousedown', (e) => {
    if (currentTool === 'fill') {
        // Get the current pixel color at the clicked position
        const pixelData = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
        const targetColor = {
            r: pixelData[0],
            g: pixelData[1],
            b: pixelData[2],
            a: pixelData[3]
        };
        
        const fillColor = hexToRgb(currentColor);
        floodFill(e.offsetX, e.offsetY, targetColor, fillColor);
        return;
    }
    
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    if (currentTool === 'shapes' && currentShape) {
        // Save a snapshot of the current canvas state
        canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const currentX = e.offsetX;
    const currentY = e.offsetY;

    if (currentTool === 'pen' || currentTool === 'eraser') {
        const data = {
            x1: startX, y1: startY, x2: currentX, y2: currentY,
            color: currentColor, thickness: currentThickness, tool: currentTool
        };
        draw(data);
        socket.emit('drawing', data);
        
        // Update start position for the next segment of the line
        [startX, startY] = [currentX, currentY];

    } else if (currentTool === 'shapes' && currentShape) {
        // Restore the snapshot to clear the previous preview
        ctx.putImageData(canvasSnapshot, 0, 0);
        
        const data = {
            x1: startX, y1: startY, x2: currentX, y2: currentY,
            color: currentColor, thickness: currentThickness, tool: 'shapes', shape: currentShape
        };
        draw(data); // Draw the preview
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    const currentX = e.offsetX;
    const currentY = e.offsetY;

    if (currentTool === 'shapes' && currentShape) {
        // Restore snapshot and draw the final shape
        ctx.putImageData(canvasSnapshot, 0, 0);
        
        const data = {
            x1: startX, y1: startY, x2: currentX, y2: currentY,
            color: currentColor, thickness: currentThickness, tool: 'shapes', shape: currentShape
        };
        draw(data); // Draw the final shape
        socket.emit('drawing', data); // Send the final shape to others
    }
    saveDrawing();
});

canvas.addEventListener('mouseout', () => {
    if (isDrawing) {
        isDrawing = false;
        saveDrawing();
    }
});

// --- TOOLBAR EVENT LISTENERS ---
function setActiveTool(tool) {
    // Reset all active states
    [penButton, eraserButton, shapesButton, fillToolButton, colorPicker].forEach(el => {
        el.classList.remove('active');
    });
    
    // Set the active tool
    currentTool = tool;
    
    // Set cursor based on tool
    if (tool === 'pen' || tool === 'shapes') {
        canvas.style.cursor = 'crosshair';
    } else if (tool === 'eraser') {
        canvas.style.cursor = 'cell';
    } else if (tool === 'fill') {
        canvas.style.cursor = 'pointer';
    }
    
    // Set active button
    if (tool === 'pen') penButton.classList.add('active');
    else if (tool === 'eraser') eraserButton.classList.add('active');
    else if (tool === 'shapes') shapesButton.classList.add('active');
    else if (tool === 'fill') fillToolButton.classList.add('active');
}

penButton.addEventListener('click', () => setActiveTool('pen'));

eraserButton.addEventListener('click', () => setActiveTool('eraser'));

colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    colorPicker.classList.add('active');
});

toolSize.addEventListener('input', (e) => {
    currentThickness = parseInt(e.target.value);
    sizeValue.textContent = currentThickness;
});
sizeValue.textContent = currentThickness; // Set initial value

// Set initial states
setActiveTool('pen'); // Set pen as default active tool

fillToolButton.addEventListener('click', () => setActiveTool('fill'));

shapesButton.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTool('shapes');
    shapesContainer.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!shapesContainer.contains(e.target) && e.target !== shapesButton) {
        shapesContainer.classList.add('hidden');
    }
});

document.querySelectorAll('[data-shape]').forEach(button => {
    button.addEventListener('click', (e) => {
        currentShape = e.target.dataset.shape;
        shapesContainer.classList.add('hidden');
        shapesButton.textContent = `Shape: ${currentShape.charAt(0).toUpperCase() + currentShape.slice(1)}`;
    });
});

clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the whiteboard?')) {
        // --- START OF FIX ---
        // Set the fill style to white
        ctx.fillStyle = 'white';
        // Fill the entire canvas with a white rectangle
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // --- END OF FIX ---
        
        localStorage.removeItem('whiteboard');
        socket.emit('clear');
    }
});

// --- SOCKET.IO LISTENERS ---
socket.on('drawing', (data) => {
    draw(data);
});

socket.on('clear', () => {
    // Fill the canvas with white so background resets properly
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('whiteboard');
});