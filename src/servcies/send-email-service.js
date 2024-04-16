import nodemailer from 'nodemailer';

const sendEmailService = async (
    {
        to = '',
        subject = 'No Reply',
        message = '<h1>No Reply</h1>',
        attachments = []
    }
)=> {
    const transporter = nodemailer.createTransport({
        host: 'localhost', //'smtp.gmail.com',
        service: 'gmail',
        port: 587, // 465
        secure: false, // true
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    })
    const info = await transporter.sendMail({
        from: "Art-Space <" + process.env.EMAIL + ">", // sender address
        to,
        subject,
        html: message, // html body
        attachments
    })
    return info.accepted.length ? true : false
}

export default sendEmailService