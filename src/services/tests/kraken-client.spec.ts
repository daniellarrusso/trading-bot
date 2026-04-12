import axios from 'axios';
import { krakenPublic, krakenPrivate } from '../kraken-client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('krakenPublic', () => {
    it('should_call_correct_public_url_when_method_provided', async () => {
        mockedAxios.get.mockResolvedValue({ data: { error: [], result: {} } });
        await krakenPublic('OHLC', { pair: 'BTC/GBP' });
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://api.kraken.com/0/public/OHLC',
            { params: { pair: 'BTC/GBP' } }
        );
    });

    it('should_return_full_response_data_when_no_errors', async () => {
        const mockData = { error: [], result: { last: 123 } };
        mockedAxios.get.mockResolvedValue({ data: mockData });
        const result = await krakenPublic('OHLC');
        expect(result).toEqual(mockData);
    });

    it('should_throw_when_kraken_returns_error_array', async () => {
        mockedAxios.get.mockResolvedValue({ data: { error: ['EGeneral:Invalid input'] } });
        await expect(krakenPublic('OHLC')).rejects.toThrow(
            'Kraken error [OHLC]: EGeneral:Invalid input'
        );
    });
});

describe('krakenPrivate', () => {
    const apiKey = 'test-api-key';
    const apiSecret = Buffer.from('test-secret').toString('base64');

    it('should_call_correct_private_url_with_auth_headers_when_credentials_provided', async () => {
        mockedAxios.post.mockResolvedValue({ data: { error: [], result: {} } });
        await krakenPrivate('Balance', apiKey, apiSecret);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.kraken.com/0/private/Balance',
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'API-Key': apiKey,
                    'API-Sign': expect.any(String),
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
            })
        );
    });

    it('should_include_nonce_in_request_body', async () => {
        mockedAxios.post.mockResolvedValue({ data: { error: [], result: {} } });
        await krakenPrivate('Balance', apiKey, apiSecret);
        const body: string = mockedAxios.post.mock.calls[0][1] as string;
        expect(body).toMatch(/nonce=\d+/);
    });

    it('should_return_full_response_data_when_no_errors', async () => {
        const mockData = { error: [], result: { XXBT: '0.5' } };
        mockedAxios.post.mockResolvedValue({ data: mockData });
        const result = await krakenPrivate('Balance', apiKey, apiSecret);
        expect(result).toEqual(mockData);
    });

    it('should_throw_when_kraken_returns_error_array', async () => {
        mockedAxios.post.mockResolvedValue({
            data: { error: ['EGeneral:Permission denied'] },
        });
        await expect(krakenPrivate('Balance', apiKey, apiSecret)).rejects.toThrow(
            'Kraken error [Balance]: EGeneral:Permission denied'
        );
    });
});