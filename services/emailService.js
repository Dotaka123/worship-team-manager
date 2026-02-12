import Mailjet from 'node-mailjet';

// Vérifier que les clés sont configurées
const isMailjetConfigured = process.env.MAILJET_API_KEY && 
                           process.env.MAILJET_API_SECRET && 
                           process.env.MAILJET_API_KEY !== 'MJ_APIKEY_PUBLIC';

let mailjet = null;

if (isMailjetConfigured) {
  mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_API_SECRET
  });
  console.log('✅ Mailjet configuré et activé');
} else {
  console.warn('⚠️  Mailjet NON configuré - Les emails ne seront pas envoyés (mode développement)');
}

/**
 * Envoie un email avec timeout et gestion d'erreurs améliorée
 */
const sendEmailWithTimeout = async (emailData, timeoutMs = 10000) => {
  // Si Mailjet n'est pas configuré, simuler un succès en mode dev
  if (!isMailjetConfigured) {
    console.log('📧 [MODE DEV] Email simulé:', emailData.Messages[0].Subject, 'vers', emailData.Messages[0].To[0].Email);
    return { success: true, mode: 'development' };
  }

  return Promise.race([
    // Promesse principale: envoi de l'email
    mailjet.post('send', { version: 'v3.1' }).request(emailData),
    // Promesse de timeout
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout lors de l\'envoi de l\'email')), timeoutMs)
    )
  ]);
};

/**
 * Envoie un email de vérification - VERSION HTML STATIQUE
 */
export const sendVerificationEmail = async (email, name, verificationToken) => {
  // ✅ PAS DE .html - La redirection s'en charge !
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }
        .content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-top: 20px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }
        h1 {
          color: white;
          margin: 0;
          font-size: 28px;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          color: white;
          margin-top: 20px;
          font-size: 14px;
          opacity: 0.9;
        }
        .expiry {
          color: #666;
          font-size: 14px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎵</div>
        <h1>Worship Team Manager</h1>
        
        <div class="content">
          <h2>Bienvenue ${name} !</h2>
          <p>Merci de vous être inscrit sur Worship Team Manager. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
          
          <a href="${verificationUrl}" class="btn">Vérifier mon email</a>
          
          <p class="expiry">Ce lien est valide pendant 24 heures.</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
        
        <div class="footer">
          <p>Worship Team Manager - Gestion de votre équipe de louange</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Bienvenue ${name} !
    
    Merci de vous être inscrit sur Worship Team Manager.
    
    Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le lien suivant :
    ${verificationUrl}
    
    Ce lien est valide pendant 24 heures.
    
    Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
    
    Worship Team Manager - Gestion de votre équipe de louange
  `;

  try {
    const request = await sendEmailWithTimeout({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'hugoasmin@gmail.com',
            Name: 'Worship Team Manager'
          },
          To: [
            {
              Email: email,
              Name: name
            }
          ],
          Subject: 'Vérifiez votre adresse email - Worship Team Manager',
          TextPart: textContent,
          HTMLPart: htmlContent
        }
      ]
    }, 10000); // Timeout de 10 secondes

    if (request.mode === 'development') {
      console.log('📧 [DEV] Email de vérification simulé pour:', email);
    } else {
      console.log('✅ Email de vérification envoyé avec succès:', request.body);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    
    // En mode développement, ne pas bloquer
    if (!isMailjetConfigured) {
      console.log('⚠️  Mode dev: Continuer malgré l\'échec de l\'email');
      return { success: true, mode: 'development' };
    }
    
    throw new Error('Impossible d\'envoyer l\'email de vérification');
  }
};

/**
 * Envoie un email de bienvenue après vérification
 */
export const sendWelcomeEmail = async (email, name) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }
        .content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-top: 20px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }
        h1 {
          color: white;
          margin: 0;
          font-size: 28px;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          color: white;
          margin-top: 20px;
          font-size: 14px;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎵</div>
        <h1>Worship Team Manager</h1>
        
        <div class="content">
          <h2>Félicitations ${name} ! ✨</h2>
          <p>Votre compte a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de Worship Team Manager.</p>
          
          <a href="${process.env.FRONTEND_URL}/login" class="btn">Se connecter</a>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Vous pouvez maintenant gérer votre équipe de louange efficacement !
          </p>
        </div>
        
        <div class="footer">
          <p>Worship Team Manager - Gestion de votre équipe de louange</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmailWithTimeout({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'hugoasmin@gmail.com',
            Name: 'Worship Team Manager'
          },
          To: [
            {
              Email: email,
              Name: name
            }
          ],
          Subject: 'Bienvenue sur Worship Team Manager ! 🎉',
          HTMLPart: htmlContent
        }
      ]
    }, 10000);

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error.message);
    // Ne pas bloquer si l'email de bienvenue échoue
    return { success: false };
  }
};

export default { sendVerificationEmail, sendWelcomeEmail };
