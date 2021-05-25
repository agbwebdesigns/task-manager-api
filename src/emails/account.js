const sgMail= require('@sendgrid/mail');
console.log(process.env.PORT);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail= (email,name) =>  {
    sgMail.send({
        to:email,
        from:'sendmail@agbwebdesigns.com',
        subject:'Welcome to the app!',
        text:`Welcome to the app, ${name}.  Let me know how this goes!`
    })
}

const sendCancelEmail= (email,name) =>  {
    sgMail.send({
        to:email,
        from:'sendmail@agbwebdesigns.com',
        subject:'We\'re Sorry to see you go!',
        text:`We're sorry you decided to leave ${name}.  If you have a minute please tell us why and if there is anything that we can change.`
    })
}

module.exports= {
    sendWelcomeEmail,
    sendCancelEmail
}