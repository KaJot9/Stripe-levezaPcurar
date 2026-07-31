/**
 * services/delivery.service.js
 *
 * Camada de ENTREGA DE ACESSO. Este é o ponto de extensão pensado para
 * o requisito de escalabilidade: "integração futura com WhatsApp,
 * Telegram, Discord e e-mail" sem reescrever a lógica principal.
 *
 * Hoje só existe o canal "email". Para adicionar um novo canal:
 *   1. Crie uma função assíncrona `enviarViaXxx(payload)`.
 *   2. Registre-a no objeto `canais` abaixo.
 *   3. Nenhum outro arquivo do sistema precisa mudar.
 */

const emailService = require('./email.service');
const customersService = require('./customers.service');
const logger = require('../utils/logger');

const canais = {
  email: async ({ email, nomePlano, linkGrupo }) =>
    emailService.enviarLinkDoGrupo({ email, nomePlano, linkGrupo })

  // Exemplo de como adicionar um novo canal no futuro:
  // whatsapp: async ({ telefone, linkGrupo }) => whatsappService.enviarMensagem(...),
  // telegram: async ({ telegramChatId, linkGrupo }) => telegramService.enviarMensagem(...),
  // discord: async ({ discordUserId, linkGrupo }) => discordService.enviarDM(...),
};

/**
 * Envia o link de acesso ao grupo para o cliente e marca como enviado
 * no banco, para nunca reenviar indevidamente (ex: após cancelamento).
 */
async function entregarAcesso({ subscriptionId, email, nomePlano, linkGrupo, canal = 'email' }) {
  const enviar = canais[canal];
  if (!enviar) {
    throw new Error(`Canal de entrega "${canal}" não implementado.`);
  }

  await enviar({ email, nomePlano, linkGrupo });
  logger.info(`[delivery] Link do grupo "${nomePlano}" enviado para ${email} via ${canal}`);

  if (subscriptionId) {
    await customersService.marcarLinkEnviado(subscriptionId);
  }
}

module.exports = { entregarAcesso };
