const { Resend } = require("resend");
const env = require("../config/env");
const logger = require("../utils/logger");

const resend = new Resend(env.resend.apiKey);

async function enviarLinkDoGrupo({ email, nomePlano, linkGrupo }) {
  const assunto = `Seu acesso ao grupo — ${nomePlano}`;

  const corpo = `
    <h2>Pagamento confirmado! 🎉</h2>

    <p>Seu pagamento foi aprovado com sucesso.</p>

    <p><strong>Plano:</strong> ${nomePlano}</p>

    <p>Seu acesso está liberado:</p>

    <p>
      <a href="${linkGrupo}">
        Entrar no grupo
      </a>
    </p>

    <hr>

    <p>Se o botão não funcionar, copie este link:</p>

    <p>${linkGrupo}</p>
  `;

  try {
    const resposta = await resend.emails.send({
      from: env.email.from,
      to: email,
      subject: assunto,
      html: corpo
    });

    logger.info(`E-mail enviado para ${email}`);

    return resposta;
  } catch (err) {
    logger.error("Erro ao enviar e-mail pelo Resend:");
    logger.error(err);

    return null;
  }
}

module.exports = {
  enviarLinkDoGrupo
};