async function get_token(credential) {
    return new Promise((resolve, reject) => {
        credential.getToken("https://cognitiveservices.azure.com/.default")
            .then(token => resolve(token.token))
            .catch(err => reject(err));
    });
}

if (require.main === module) {
    const { ClientSecretCredential } = require('@azure/identity');

    const appId = "01438b42-7198-4043-a663-cd305abfbc24";
    const tenantId = "dc5fceee-1ddb-40db-a438-f01e5748ba2a";
    const clientSecret = "wZ_8Q~XPJhw5pWrh5dojfVhNOkTgWESjyrSU7ceb";

    const credential = new ClientSecretCredential(tenantId, appId, clientSecret);

    // 在这里，你可以调用 login 函数，并打印返回的结果
    get_token(credential)
        .then(token => console.log(token))
        .catch(err => console.error(err));
}

module.exports = get_token;
