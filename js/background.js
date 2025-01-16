let getTabId = null;

// Função para remover o iframe e observar a página
function removeIframeAndObserve(tabId) {
    if (!tabId) return;

    chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true }, // Inclui todos os frames
        func: () => {
            // Variável global para armazenar o MutationObserver
            window.iframeObserver = window.iframeObserver || null;

            const removeIframe = () => {
                document.querySelectorAll('iframe').forEach((el) => {
                    if (el.id === "webpack-dev-server-client-overlay") {
                        el.remove();
                    }
                });
            };
    
            // Inicia a remoção do iframe e a observação
            if (!window.iframeObserver) {
                removeIframe();
                window.iframeObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.addedNodes.length) {
                            removeIframe();
                        }
                    });
                });
    
                window.iframeObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                });
            }
        }
    }).catch(err => console.error("Erro ao executar o script:", err));
}

// Função para iniciar a remoção do iframe e observação
function startIframeRemoval(tabId) {
    if (!tabId) return;
    removeIframeAndObserve(tabId);
}

// Função para parar a observação do iframe
function stopIframeRemoval(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            if (window.iframeObserver) {
                window.iframeObserver.disconnect();
                window.iframeObserver = null; // Limpa o estado
            }
        }
    }).catch(err => console.error("Erro ao parar a observação:", err));
}

// Função para verificar a URL da aba e remover o iframe se necessário
function checkAndRemoveIframe(tabId, changeInfo) {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get('isChecked', function (data) {
            chrome.tabs.get(tabId, (tab) => {
                if (tab.url.startsWith("http://facilita")) {
                    getTabId = tab.id;
                    data.isChecked ? startIframeRemoval(getTabId) : stopIframeRemoval(getTabId);
                }
            });
        });
    }
}

// Listener para quando a aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    checkAndRemoveIframe(tabId, changeInfo);
});

// Listener para quando a navegação na web é completada
chrome.webNavigation.onCompleted.addListener((details) => {
    checkAndRemoveIframe(details.tabId, { status: 'complete' });
});

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSwitch') {
        if (getTabId) {
            message.isChecked ? startIframeRemoval(getTabId) : stopIframeRemoval(getTabId);
        }
    }
});
