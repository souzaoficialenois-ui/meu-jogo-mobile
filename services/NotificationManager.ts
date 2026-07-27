import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

export class NotificationManager {
  private static instance: NotificationManager;

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Verifica se o jogo está rodando em ambiente nativo de aplicativo móvel (Android/iOS via Capacitor).
   */
  public isNative(): boolean {
    if (typeof window === 'undefined') return false;
    const Cap = (window as any).Capacitor;
    if (!Cap) return false;
    try {
      if (typeof Cap.getPlatform === 'function') {
        const platform = Cap.getPlatform();
        return platform === 'android' || platform === 'ios';
      }
    } catch (e) {
      // Silent error
    }
    return false;
  }

  /**
   * Solicita permissão para notificações locais e push.
   * Retorna os status de permissão obtidos tanto para notificações locais quanto push.
   */
  public async requestPermission(): Promise<{ local: string; push: string }> {
    let localStatus = 'default';
    let pushStatus = 'default';

    // 1. Solicita permissão no Navegador Web (Padrão)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (typeof Notification.requestPermission === 'function') {
          const webPermission = await Notification.requestPermission();
          localStatus = webPermission;
          console.log('Settings: Web notification permission status:', webPermission);
        } else {
          console.log('Notification.requestPermission is not a function.');
        }
      } catch (err) {
        console.log('Web notifications blocked or not supported in this iframe environment.');
      }
    }

    // 2. Solicita permissão Nativa de Celular (se executado via APK/Capacitor)
    if (this.isNative()) {
      // Permissão para Notificações Locais (Banners informativos do jogo)
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          // O bloco try/catch garante que, mesmo que o usuário clique em permitir,
          // qualquer falha na criação nativa do canal seja silenciada sem fechar o app.
          const localPerms = await LocalNotifications.requestPermissions();
          localStatus = localPerms.display;
          console.log('Settings: Native LocalNotifications permission requested:', localPerms);
        } else {
          localStatus = status.display;
          console.log('Settings: Native LocalNotifications permission already granted:', status);
        }
      } catch (err: any) {
        console.error('O Capacitor evitou um crash de notificação (Local):', err?.message || err);
      }

      // Permissão para Notificações Push (Mensagens de Servidor remotas)
      // NOTA DE SEGURANÇA: Desativamos a solicitação e registro de Push Notifications nativas (FCM/APNs)
      // porque o aplicativo não possui um arquivo 'google-services.json' ou de credenciais nativas configurado.
      // Chamar PushNotifications.register() ou requestPermissions() sem essa configuração nativa causaria
      // um crash fatal e imediato no APK compilado. Como o jogo utiliza apenas LocalNotifications (notificações locais/offline),
      // desativar o Push evita 100% dos crashes sem perder nenhuma funcionalidade ativa do jogo.
      pushStatus = 'denied';
    }

    return { local: localStatus, push: pushStatus };
  }

  /**
   * Configura os listeners de ações e recebimento de Notificações Push FCM básicas.
   */
  private setupPushListeners() {
    if (!this.isNative()) return;

    try {
      // Recebe o Token de Registro do dispositivo para enviar Push Notifications via painel administrativo
      PushNotifications.addListener('registration', (token) => {
        console.log('Push Notification: Token registrado com sucesso:', token.value);
        localStorage.setItem('push_device_token', token.value);
      });

      // Erro na inicialização ou sem suporte ao Google Play Services
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push Notification: Erro ao registrar:', JSON.stringify(error));
      });

      // Evento quando uma Push Notification chega com o aplicativo aberto (Foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push Notification recebida em primeiro plano:', JSON.stringify(notification));
      });

      // Evento disparado quando o usuário clica/toca na Notificação no painel de notificações
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Usuário clicou na Push Notification:', JSON.stringify(notification));
      });
    } catch (e) {
      console.warn('Listeners de notificações push nativas não puderam ser adicionados:', e);
    }
  }

  /**
   * Envia uma notificação local imediatamente para o usuário.
   * Utiliza o agendamento local nativo em dispositivos móveis, e a Web Notifications API nos navegadores padrão.
   */
  public async sendNotification(title: string, body: string): Promise<boolean> {
    console.log(`Disparando Notificação: "${title}" - "${body}"`);

    // 1. Fluxo para Dispositivo Móvel NATIVO (APK Android)
    if (this.isNative()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 1000000),
              extra: { origin: 'dragon-duel' },
              sound: 'default'
            }
          ]
        });
        return true;
      } catch (err) {
        console.error('Error sending native local notification:', err);
      }
    }

    // 2. Fluxo para Navegador Web (Fallback de desenvolvimento e players de PC)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: body,
            icon: '/favicon.ico'
          });
          return true;
        } catch (e) {
          console.error('Falha de instanciação direta da Web Notification, tentando via Service Worker:', e);
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.ready;
              registration.showNotification(title, { body: body, icon: '/favicon.ico' });
              return true;
            } catch (swErr) {
              console.error('Service Worker falhou ao mostrar notificação:', swErr);
            }
          }
        }
      } else {
        console.warn('Permissão para notificações do navegador não está concedida.');
      }
    }

    return false;
  }

  /**
   * Agenda uma notificação local para ser disparada após alguns segundos.
   */
  public async scheduleNotification(title: string, body: string, delaySeconds: number): Promise<void> {
    if (this.isNative()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 1000 * delaySeconds) },
              sound: 'default'
            }
          ]
        });
        console.log(`Notificação nativa agendada para daqui a ${delaySeconds} segundos.`);
      } catch (err) {
        console.error('Error scheduling native notification:', err);
      }
    } else {
      // Fallback simples simulando agendamento na web
      setTimeout(() => {
        this.sendNotification(title, body);
      }, delaySeconds * 1000);
      console.log(`Notificação web agendada em memória para daqui a ${delaySeconds} segundos.`);
    }
  }

  /**
   * Envia uma notificação de teste divertida com temática Dragon Ball.
   */
  public async sendTestNotification(): Promise<boolean> {
    const notifications = [
      {
        title: "⚡ Seu Ki está no limite máximo!",
        body: "Goku convocou você para recarregar as energias e desafiar oponentes na arena!"
      },
      {
        title: "🏆 O Torneio de Artes Marciais começou!",
        body: "Vá ao saguão principal, defina sua equipe e derrote guerreiros de outros universos!"
      },
      {
        title: "🔥 Novo Evento Lendário!",
        body: "Guerreiros SSJ estão prontos para fusões épicas. Invoque novas skins agora!"
      },
      {
        title: "📦 Seu prêmio diário está disponível!",
        body: "Abra seus bilhetes de invocação grátis no painel de Summon."
      }
    ];

    const pick = notifications[Math.floor(Math.random() * notifications.length)];
    return this.sendNotification(pick.title, pick.body);
  }
}
