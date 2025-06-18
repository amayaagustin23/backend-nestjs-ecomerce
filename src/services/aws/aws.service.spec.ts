import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as uuid from 'uuid';
import { UploadService } from './aws.service';

jest.mock('@aws-sdk/client-s3');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('UploadService', () => {
  let uploadService: UploadService;
  let mockSend: jest.Mock;
  const mockConstructor = jest.fn();

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values = {
        AWS_REGION: 'us-east-1',
        S3_BUCKET: 'test-bucket',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
      };
      return values[key];
    }),
  };

  beforeAll(() => {
    (PutObjectCommand as unknown as jest.Mock).mockImplementation(
      (args: any) => {
        mockConstructor(args);
        return {};
      },
    );
  });

  beforeEach(() => {
    mockSend = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    (uuid.v4 as jest.Mock).mockReturnValue('test-uuid');

    uploadService = new UploadService(mockConfigService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería subir el archivo y retornar la URL', async () => {
    const mockFile = {
      originalname: 'imagen.png',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-image'),
    } as Express.Multer.File;

    const expectedKey = 'products/test-uuid.png';
    const expectedUrl =
      'https://test-bucket.s3.us-east-1.amazonaws.com/products/test-uuid.png';

    mockSend.mockResolvedValue({}); // Simula respuesta de S3

    const result = await uploadService.upload(mockFile);

    expect(result).toBe(expectedUrl);

    expect(mockConstructor).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: expectedKey,
      Body: mockFile.buffer,
      ContentType: 'image/png',
    });
  });
});
