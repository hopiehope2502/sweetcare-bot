const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const usuarios = {};

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ El bot está listo para funcionar');
});

const palabrasReinicio = ['cancelar', 'reiniciar', 'empezar de nuevo'];

client.on('message', async (message) => {
    const userMessage = message.body.toLowerCase().trim();
    const userId = message.from;

    if (!usuarios[userId]) {
        usuarios[userId] = {
            paso: null,
            name: '',
            age: '',
            address: '',
            date: '',
            time: '',
            bienvenidaEnviada: false,
            activo: false
        };
    }

    const usuario = usuarios[userId];

    // Reinicio manual
    const deseaReiniciar = palabrasReinicio.some(p => userMessage.includes(p));
    if (deseaReiniciar) {
        usuarios[userId] = {
            paso: null,
            name: '',
            age: '',
            address: '',
            date: '',
            time: '',
            bienvenidaEnviada: true,
            activo: true
        };
        await message.reply('🔄 El proceso ha sido reiniciado.\nAquí tienes el menú para comenzar de nuevo:\n1️⃣. Agendar cita\n2️⃣. Información sobre servicios\n3️⃣. Atención personalizada');
        return;
    }

    // Bienvenida
    if (!usuario.bienvenidaEnviada) {
        await message.reply('¡Bienvenidos a SweetCare 💜! Escribe menú para ver las opciones');
        usuario.bienvenidaEnviada = true;
    }

    // Activar menú
    if (userMessage === 'menú') {
        usuario.paso = null;
        usuario.activo = true;
        await message.reply('Elige una opción:\n1️⃣. Agendar cita\n2️⃣. Información sobre servicios\n3️⃣. Atención personalizada');
        return;
    }

    // Si el usuario no está activo, ignorar mensajes (a menos que pida menú o reiniciar)
    if (!usuario.activo) return;

    // Opciones principales
    if (userMessage === '1' || userMessage === 'agendar cita') {
        usuario.paso = 'nombre';
        await message.reply('¡Perfecto! ¿Cómo te llamas? 👤');
        return;
    }

    if (userMessage === '2' || userMessage === 'información sobre servicios') {
        await message.reply('Nuestros servicios incluyen:\n👶 Cuidado diario\n🕒 Niñeras por horas\n🌙 Cuidado nocturno');
        usuario.activo = false;
        return;
    }

    if (userMessage === '3' || userMessage === 'atención personalizada') {
        usuario.paso = 'personalizada';
        await message.reply('Por favor, cuéntanos más sobre lo que necesitas y te ayudaremos. 💬');
        return;
    }

    // Atención personalizada
    if (usuario.paso === 'personalizada') {
        usuario.paso = null;
        usuario.activo = false;
        await message.reply('¡Muchas gracias! 🙌 En breve nos comunicaremos contigo 💜');
        return;
    }

    // Flujo paso a paso
    switch (usuario.paso) {
        case 'nombre':
            usuario.name = message.body;
            usuario.paso = 'edad';
            await message.reply(`Gracias, ${usuario.name} 😄. ¿Qué edad tiene el/los niño/niños? 👶`);
            break;

        case 'edad':
            usuario.age = message.body;
            usuario.paso = 'direccion';
            await message.reply('¿Cuál es la dirección del servicio? 📍');
            break;

        case 'direccion':
            usuario.address = message.body;
            usuario.paso = 'fecha';
            await message.reply('¿Para qué fecha deseas agendar el servicio? 📅');
            break;

        case 'fecha':
            usuario.date = message.body;
            usuario.paso = 'hora';
            await message.reply('¿Entre qué horario te gustaría que sea el servicio? ⏰');
            break;

        case 'hora':
            usuario.time = message.body;
            usuario.paso = null;
            usuario.activo = false; // 🚫 Conversación terminada
            await message.reply(
                `✅ ¡Gracias, ${usuario.name}!\nSe está gestionando tu cita para el ${usuario.date} a las ${usuario.time}.\n📍 Dirección: ${usuario.address}\nUna vez sea agendada, nos comunicaremos contigo 💜`
            );
            break;

        default:
            // Esto ya no interrumpe después de terminar una conversación
            await message.reply('Escribe "menú" para ver las opciones disponibles o "cancelar" para reiniciar el proceso. 📝');
            break;
    }
});

client.initialize();
