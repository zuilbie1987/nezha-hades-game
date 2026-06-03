export const Input: { keys: Record<string, boolean> } = { 
    // 新增 '1', '2', '3'
    keys: { w: false, a: false, s: false, d: false, space: false, j: false, f: false, '1': false, '2': false, '3': false } 
};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w','a','s','d',' ','j','f','1','2','3'].includes(key)) {
        Input.keys[key === ' ' ? 'space' : key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w','a','s','d',' ','j','f','1','2','3'].includes(key)) {
        Input.keys[key === ' ' ? 'space' : key] = false;
    }
});