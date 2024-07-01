const NAMES = [
"Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Alexander",
"Mia", "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Charlotte", "Amelia", "Harper", "Evelyn"
];

window.onload= () => {
    let name = window.localStorage.getItem('smg-n')
    if(name) {
        document.querySelector('#usernameInput').value = name;
    } else {
        name = NAMES[Math.floor(Math.random() * NAMES.length)];
        document.querySelector('#usernameInput').value = name ?? '';
    }
};

const updateName = () => {
    const ni = document.querySelector('#usernameInput');
    const name = ni.value;
    window.localStorage.setItem('smg-n', name);
}