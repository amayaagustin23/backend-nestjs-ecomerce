import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, Role } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { OrderWithItems } from 'src/common/interfaces/index.interface';
import { MessagingService } from './messaging.service';
import { EMAIL_PROVIDER } from './messaging.types';

const emailService = { send: jest.fn() };

const i18n: I18nService = {
  t: jest.fn().mockImplementation(async (key: string) => {
    const responses: Record<string, string> = {
      'emails.registerEmail.subject': '¡Bienvenido a la plataforma!',
      'emails.registerEmail.body': '<p>Hola {{name}}, bienvenido</p>',
      'emails.resetPassword.subject': 'Cambio de contraseña',
      'emails.resetPassword.body':
        '<p>Tu contraseña fue cambiada exitosamente.</p>',
      'emails.recoverPassword.subject': 'Recupera tu contraseña',
      'emails.recoverPassword.body': '<a href="{{redirectUrl}}">Recuperar</a>',
      'emails.notificationCartActive.subject':
        'Hola {{name}}, tenés productos pendientes en tu carrito 🛒',
      'emails.notificationCartActive.body':
        '<p>{{name}}, revisá tu carrito en {{email}}</p>',
      'emails.paymentApproved.subject': '¡Gracias por tu compra, {{name}}!',
      'emails.paymentApproved.body':
        '<p>{{name}} - {{email}}</p><div>{{itemsList}}</div> {{orderId}} {{subtotal}} {{shippingCost}} {{total}}',
    };
    return responses[key] || key;
  }),
} as any;

const mockUser = {
  id: '123',
  email: 'user@example.com',
  role: Role.USER,
  password: 'hash',
  isActive: true,
  isDeleted: false,
  createdAt: new Date(),
  points: 0,
  person: {
    id: 'p1',
    name: 'John',
    phone: '12345678',
    cuitOrDni: '12345678',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    userId: '123',
  },
};

const order: OrderWithItems = {
  id: 'order-1',
  subtotal: 1000,
  shippingCost: 200,
  total: 1200,
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false,
  userId: '123',
  status: OrderStatus.PAID,
  paymentConfirmed: new Date(),
  couponId: null,
  items: [
    {
      id: 'item-1',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      orderId: 'order-1',
      productId: 'prod-1',
      variantId: 'var-1',
      product: { name: 'Producto A' },
      variant: { sizeId: 'M', colorId: 'Rojo' },
      quantity: 2,
      discount: 100,
      unitPrice: 600,
      finalPrice: 500,
    },
  ],
};

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: EMAIL_PROVIDER, useValue: emailService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  it('should send register email', async () => {
    await service.sendRegisterUserEmail({
      from: 'from@example.com',
      to: 'user@example.com',
      user: { name: 'John' },
    });

    expect(emailService.send).toHaveBeenCalled();
  });

  it('should send reset password email', async () => {
    await service.sendResetPasswordEmail({
      from: 'from@example.com',
      to: 'user@example.com',
    });

    expect(emailService.send).toHaveBeenCalled();
  });

  it('should send recover password email', async () => {
    await service.sendRecoverPasswordEmail({
      from: 'from@example.com',
      to: 'user@example.com',
      redirectUrl: 'https://example.com/reset',
    });

    expect(emailService.send).toHaveBeenCalled();
  });

  it('should send notification cart active email', async () => {
    await service.sendNotificationCartActive({
      from: 'from@example.com',
      to: 'user@example.com',
      user: mockUser,
    });

    expect(emailService.send).toHaveBeenCalled();
  });

  it('should send payment approved email with items', async () => {
    await service.sendPaymentStatusEmail({
      status: 'Approved',
      from: 'from@example.com',
      to: 'user@example.com',
      user: mockUser,
      order,
    });

    expect(emailService.send).toHaveBeenCalled();
  });
});
