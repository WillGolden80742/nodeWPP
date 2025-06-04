# nodeWPP - Envio de Mensagens WhatsApp Automatizado

Este projeto permite o envio de mensagens personalizadas em massa através do WhatsApp, utilizando a biblioteca `whatsapp-web.js`. Você pode importar contatos, gerenciar uma lista de contatos na interface web e enviar mensagens personalizadas com facilidade.

## Características

*   **Importação de Contatos:** Importe contatos de arquivos CSV e VCF. Selecione as colunas correspondentes aos nomes e telefones no arquivo CSV.
*   **Gerenciamento de Contatos:** Adicione, edite e exclua contatos diretamente na interface web. A lista de contatos é persistida no servidor.
*   **Pesquisa de Contatos:** Filtre a lista de contatos por nome ou número de telefone.
*   **Seleção Múltipla:** Selecione contatos individualmente ou em lote para o envio de mensagens.
*   **Personalização de Mensagens:** Utilize variáveis como `[name]` e `[greeting]` para personalizar as mensagens.
*   **Modo de Teste:** Envie mensagens em modo de teste sem efetivamente enviar as mensagens para os contatos.
*   **Interface Web:** Interface amigável para gerenciar contatos e configurar o envio de mensagens.
*   **Saudações Personalizadas:** Inclui suporte para saudações baseadas na hora do dia e idioma (Bom dia, Boa tarde, Boa noite).
*   **Atualização em Tempo Real:** A lista de contatos é atualizada em tempo real para todos os clientes conectados via WebSocket.
*   **Persistência de Dados:** Os contatos são armazenados no servidor, garantindo que não sejam perdidos ao fechar o navegador.

## Tecnologias Utilizadas

*   **Node.js:** Ambiente de execução JavaScript para o servidor.
*   **Express:** Framework web para Node.js, utilizado para criar o servidor e gerenciar as rotas.
*   **Socket.IO:** Biblioteca para comunicação em tempo real bidirecional entre clientes web e servidor.
*   **whatsapp-web.js:** Biblioteca para controlar o WhatsApp Web através do Node.js.
*   **qrcode-terminal:** Biblioteca para exibir o QR Code no terminal.
*   **express-fileupload:** Middleware para facilitar o upload de arquivos.
*   **Bootstrap:** Framework CSS para estilização da interface web.
*   **Material Design Icons:** Conjunto de ícones para a interface web.
*   **JavaScript:** Linguagem de programação para a lógica do cliente e do servidor.
*   **HTML:** Linguagem de marcação para a estrutura da interface web.
*   **CSS:** Linguagem de estilo para a apresentação visual da interface web.
*   **Zlib:** Biblioteca para compactação/descompactação gzip.

## Pré-requisitos

*   **Node.js:** Certifique-se de ter o Node.js instalado em sua máquina. Você pode baixá-lo em [https://nodejs.org/](https://nodejs.org/).
*   **NPM (Node Package Manager):** O NPM é instalado automaticamente com o Node.js.
*   **Google Chrome:** É recomendável que o Google Chrome esteja instalado, pois o `puppeteer` (dependência do `whatsapp-web.js`) o utiliza para controlar o WhatsApp Web.

## Instalação

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/WillGolden80742/nodeWPP.git
    cd nodeWPP
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

## Configuração

1.  **Caminho do Chrome (Opcional):**

    *Por padrão, o `whatsapp-web.js` tentará encontrar uma instalação do Chrome.*

    Se você tiver problemas, pode especificar o caminho para o executável do Chrome no arquivo `index.js`. Certifique-se de substituir o caminho existente pelo caminho correto no seu sistema:

    ```javascript
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Substitua pelo seu caminho
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });
    ```

2.  **Execução:**

    ```bash
    npm start
    ```

    Isso iniciará o servidor Node.js.

3.  **Acesse a interface web:**

    Abra o seu navegador e acesse `http://localhost:3000`.

## Utilização

1.  **Autenticação:** Ao iniciar o servidor, um QR Code será exibido no terminal. Escaneie este QR Code com o seu celular utilizando o WhatsApp (WhatsApp Web > Aparelhos Conectados).

2.  **Importar Contatos:** Clique no botão "Selecione o arquivo" e selecione um arquivo CSV ou VCF contendo seus contatos. Se for um arquivo CSV, selecione as colunas correspondentes aos nomes e telefones.

3.  **Gerenciar Contatos:**
    *   Utilize a barra de pesquisa para filtrar contatos.
    *   Selecione os contatos que você deseja enviar a mensagem marcando os checkboxes.
    *   Clique em "Selecionar Todos" ou "Desmarcar Todos" para selecionar/desmarcar todos os contatos.
    *   Adicione contatos individuais utilizando o formulário "Adicionar Contato Individual".

4.  **Escrever Mensagem:** Escreva a mensagem que você deseja enviar no campo "Mensagem". Utilize as variáveis `[name]` para o nome do contato e `[greeting]` para uma saudação personalizada (Bom dia, Boa tarde, Boa noite).

5.  **Modo de Teste:** Marque a caixa "Modo de Teste" se você quiser testar o envio de mensagens sem realmente enviá-las.

6.  **Enviar Mensagens:** Clique no botão "Enviar Mensagens" para iniciar o processo de envio.

7.  **Visualizar Resultados:** Uma janela flutuante será exibida com o resultado do envio das mensagens para cada contato.

## Observações

*   **WhatsApp Web:** Este projeto utiliza o WhatsApp Web. Certifique-se de que sua conta do WhatsApp esteja conectada ao WhatsApp Web para que as mensagens possam ser enviadas.
*   **Política do WhatsApp:** O uso excessivo de envio de mensagens automatizadas pode violar os termos de serviço do WhatsApp e resultar no bloqueio da sua conta. Use este projeto com responsabilidade.
*   **Erro no envio:** As vezes o whatsapp-web.js apresenta erros de conexão, nesse caso, reinicie o serviço e tente novamente.
*   **Atualização em tempo real:** As alterações feitas na lista de contatos serão automaticamente refletidas em todos os clientes conectados.
