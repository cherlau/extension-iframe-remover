document.addEventListener('DOMContentLoaded', function () { 
    const toggleSwitch = document.querySelector('#toggleSwitch');

    // Recupera o estado salvo ao abrir o popup
    chrome.storage.sync.get('isChecked', function (data) {
        toggleSwitch.checked = data.isChecked || false;
    });

    // Salva o estado quando o checkbox for alterado
    toggleSwitch.addEventListener('change', () => {
        chrome.storage.sync.set({ isChecked: toggleSwitch.checked }, () => {
            // Envia uma mensagem para o background script para atualizar o estado
            chrome.runtime.sendMessage({ action: 'updateSwitch', isChecked: toggleSwitch.checked });
        });
    });
});
