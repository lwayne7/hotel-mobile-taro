/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HotelCard } from './index';
import type { Hotel } from '../../types/hotel';

/** 最小化的 Hotel mock，满足 HotelCard 渲染需要 */
function createMockHotel(overrides: Partial<Hotel> = {}): Hotel {
    return {
        id: 1,
        nameCn: '测试酒店',
        address: '北京市朝阳区测试路 1 号',
        starRating: 4,
        roomTypes: [
            {
                id: 101,
                name: '大床房',
                price: 399,
                originalPrice: 499,
                discountType: 'percentage',
                bedType: '大床',
                roomSize: 30,
                maxGuests: 2,
            },
        ],
        images: [{ id: 1, imageUrl: 'https://example.com/hotel.jpg', description: '大堂' }],
        facilities: ['免费WiFi', '游泳池', '健身房'],
        ...overrides,
    };
}

describe('HotelCard', () => {
    it('renders hotel name, address and star rating', () => {
        const hotel = createMockHotel();
        render(<HotelCard hotel={hotel} />);

        expect(screen.getByText('测试酒店')).toBeInTheDocument();
        expect(screen.getByText('北京市朝阳区测试路 1 号')).toBeInTheDocument();
        // 4 星应显示 4 个 ★
        expect(screen.getByText('★★★★')).toBeInTheDocument();
    });

    it('renders minimum price from roomTypes', () => {
        const hotel = createMockHotel();
        render(<HotelCard hotel={hotel} />);

        // 房型最低价 ¥399
        expect(screen.getByText('¥399')).toBeInTheDocument();
    });

    it('renders facility tags (max 3)', () => {
        const hotel = createMockHotel({
            facilities: ['免费WiFi', '游泳池', '健身房', '会议室'],
        });
        render(<HotelCard hotel={hotel} />);

        expect(screen.getByText('免费WiFi')).toBeInTheDocument();
        expect(screen.getByText('游泳池')).toBeInTheDocument();
        expect(screen.getByText('健身房')).toBeInTheDocument();
        // 第 4 个不应显示
        expect(screen.queryByText('会议室')).not.toBeInTheDocument();
    });

    it('renders discount badge for percentage discount', () => {
        const hotel = createMockHotel();
        render(<HotelCard hotel={hotel} />);

        // (1 - 399/499) * 100 ≈ 20%
        expect(screen.getByText('20%OFF')).toBeInTheDocument();
    });

    it('shows placeholder text when image is missing', () => {
        const hotel = createMockHotel({ images: [], roomTypes: [{ id: 1, name: '标间', price: 200 }] });
        render(<HotelCard hotel={hotel} />);

        expect(screen.getByText('暂无图片')).toBeInTheDocument();
    });

    it('fires onClick callback when card is clicked', () => {
        const hotel = createMockHotel();
        const handleClick = vi.fn();
        render(<HotelCard hotel={hotel} onClick={handleClick} />);

        // 点击外层卡片容器
        fireEvent.click(screen.getByText('测试酒店'));
        expect(handleClick).toHaveBeenCalledWith(hotel);
    });

    it('renders original price with strikethrough when discount exists', () => {
        const hotel = createMockHotel();
        render(<HotelCard hotel={hotel} />);

        // 原价 ¥499 应显示
        expect(screen.getByText('¥499')).toBeInTheDocument();
    });

    it('renders simulated score', () => {
        const hotel = createMockHotel({ id: 10 });
        render(<HotelCard hotel={hotel} />);

        // getSimulatedScore: (10 % 31) / 10 + 4.3 = 5.3 → capped at 5.0
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('超棒')).toBeInTheDocument();
    });
});
