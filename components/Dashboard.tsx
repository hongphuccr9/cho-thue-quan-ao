
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ClothingItem, Customer, Rental, View } from '../types';
import { Card } from './shared/Card';
import { format, getYear, getMonth, getWeek } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { subWeeks } from 'date-fns/subWeeks';
import { subMonths } from 'date-fns/subMonths';
import { subYears } from 'date-fns/subYears';
import { vi } from 'date-fns/locale/vi';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface DashboardProps {
  clothingItems: ClothingItem[];
  customers: Customer[];
  rentals: Rental[];
  rentedItemCounts: Map<number, number>;
  setView: (view: View) => void;
}

// Custom Tooltip for Revenue Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    return (
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-bold text-base">{data.fullName || label}</p>
        <p className="text-sm text-primary-600 dark:text-primary-400">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
        </p>
      </div>
    );
  }
  return null;
};

// Chart Type Icons
const BarChartIconSvg: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v4m4-10v10m4-4v4m4-8v8m4-13v13" />
    </svg>
);
const LineChartIconSvg: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const AreaChartIconSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className || "w-5 h-5"} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M1 15.5l3.75-3.75a.75.75 0 011.06 0l2.44 2.44a.75.75 0 001.06 0l4.3-4.3a.75.75 0 011.12.06l3.75 5.25a.75.75 0 01-.94 1.18l-3.2-4.48a.75.75 0 00-1.06 0l-4.3 4.3a.75.75 0 01-1.06 0L4.47 12.28a.75.75 0 00-1.06 0L1.94 13.82a.75.75 0 01-1.18-.94zM1 4.75a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 4.75z" clipRule="evenodd" />
    </svg>
);

// --- New Icons for Stat Cards ---
const TotalItemsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-8 h-8"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1014.12 11.88l-4.242 4.242z"></path></svg>
);
const StockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-8 h-8"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
);
const RentedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-8 h-8"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
);
const OverdueIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || "w-8 h-8"} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);


const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animationDuration = 1000; // 1 second
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(animationDuration / frameDuration);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out function for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(value * easedProgress);
      
      setDisplayValue(currentValue);

      if (frame === totalFrames) {
        clearInterval(counter);
        setDisplayValue(value); // Ensure it ends on the exact value
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [value]);

  return <span>{displayValue.toLocaleString('vi-VN')}</span>;
};


export const Dashboard: React.FC<DashboardProps> = ({ clothingItems, customers, rentals, rentedItemCounts, setView }) => {
  const [revenueView, setRevenueView] = useState<'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const activeRentals = rentals.filter(r => !r.returnDate);
  const overdueRentals = activeRentals.filter(r => new Date() > parseISO(r.dueDate));
  const totalItemsStock = clothingItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const mostPopularItems = [...clothingItems]
    .sort((a, b) => (rentedItemCounts.get(b.id) || 0) - (rentedItemCounts.get(a.id) || 0))
    .slice(0, 5)
    .filter(item => (rentedItemCounts.get(item.id) || 0) > 0);

  const stats = [
    { title: 'Tổng Số Loại Đồ', value: clothingItems.length, icon: <TotalItemsIcon />, color: 'text-blue-600 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30', navTarget: 'clothing' as const },
    { title: 'Tổng Số Lượng Trong Kho', value: totalItemsStock, icon: <StockIcon />, color: 'text-teal-600 dark:text-teal-300', bgColor: 'bg-teal-100 dark:bg-teal-900/30', navTarget: 'clothing' as const },
    { title: 'Đang Cho Thuê', value: activeRentals.length, icon: <RentedIcon />, color: 'text-green-600 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30', navTarget: 'rentals' as const },
    { title: 'Quá Hạn Trả', value: overdueRentals.length, icon: <OverdueIcon />, color: 'text-red-600 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30', navTarget: 'rentals' as const },
  ];
  
  const clothingItemMap = new Map<number, ClothingItem>(clothingItems.map(item => [item.id, item]));

  const topSpendingCustomers = useMemo(() => {
    const now = new Date();
    const currentYear = getYear(now);
    const customerSpending = new Map<number, number>();

    rentals.forEach(rental => {
        if (rental.totalPrice && getYear(parseISO(rental.rentalDate)) === currentYear) {
            const currentSpending = customerSpending.get(rental.customerId) || 0;
            customerSpending.set(rental.customerId, currentSpending + rental.totalPrice);
        }
    });

    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    return Array.from(customerSpending.entries())
        .map(([customerId, totalSpent]) => ({
            id: customerId,
            name: customerMap.get(customerId) || 'Khách hàng không xác định',
            totalSpent,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

  }, [rentals, customers]);

  const revenueData = useMemo(() => {
    const now = new Date();
    let data: { name: string; fullName: string; DoanhThu: number }[] = [];
    
    if (revenueView === 'month') {
        const last12Months = Array.from({ length: 12 }, (_, i) => subMonths(now, i)).reverse();
        data = last12Months.map(monthStart => ({
            name: format(monthStart, 'M/yy', { locale: vi }),
            fullName: format(monthStart, 'MMMM yyyy', { locale: vi }),
            DoanhThu: 0
        }));
        rentals.forEach(rental => {
            if (!rental.totalPrice) return;
            const rentalDate = parseISO(rental.rentalDate);
            const monthIndex = last12Months.findIndex(monthStart => getYear(rentalDate) === getYear(monthStart) && getMonth(rentalDate) === getMonth(monthStart));
            if (monthIndex !== -1) {
                data[monthIndex].DoanhThu += rental.totalPrice;
            }
        });
    } else if (revenueView === 'week') {
        const last12Weeks = Array.from({ length: 12 }, (_, i) => subWeeks(now, i)).reverse();
        data = last12Weeks.map(weekStart => ({
            name: `T${getWeek(weekStart, { locale: vi, weekStartsOn: 1 })}`,
            fullName: `Tuần ${getWeek(weekStart, { locale: vi, weekStartsOn: 1 })}, ${getYear(weekStart)}`,
            DoanhThu: 0
        }));
        rentals.forEach(rental => {
            if (!rental.totalPrice) return;
            const rentalDate = parseISO(rental.rentalDate);
            const weekIndex = last12Weeks.findIndex(weekStart => getYear(rentalDate) === getYear(weekStart) && getWeek(rentalDate, { locale: vi, weekStartsOn: 1 }) === getWeek(weekStart, { locale: vi, weekStartsOn: 1 }));
            if (weekIndex !== -1) {
                data[weekIndex].DoanhThu += rental.totalPrice;
            }
        });
    } else if (revenueView === 'year') {
        const last5Years = Array.from({ length: 5 }, (_, i) => subYears(now, i)).reverse();
        data = last5Years.map(yearStart => ({
            name: format(yearStart, 'yyyy'),
            fullName: `Năm ${format(yearStart, 'yyyy')}`,
            DoanhThu: 0
        }));
        rentals.forEach(rental => {
            if (!rental.totalPrice) return;
            const rentalDate = parseISO(rental.rentalDate);
            const yearIndex = last5Years.findIndex(yearStart => getYear(rentalDate) === getYear(yearStart));
            if (yearIndex !== -1) {
                data[yearIndex].DoanhThu += rental.totalPrice;
            }
        });
    }
    return data;
  }, [rentals, revenueView]);
  

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const isClickable = !!stat.navTarget;
          // Use a button for clickable cards for accessibility, otherwise use a div
          const WrapperComponent = isClickable ? 'button' : 'div';
          const wrapperProps = isClickable ? {
            onClick: () => setView(stat.navTarget!),
            className: "text-left w-full h-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg",
            'aria-label': `Chuyển đến trang ${stat.title}`
          } : {};

          return (
            <WrapperComponent key={stat.title} {...wrapperProps}>
              <Card className={`
                    !p-4 flex flex-col justify-between h-full
                    transform transition-all duration-500 ease-out
                    ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    ${isClickable ? 'hover:-translate-y-2 hover:shadow-xl cursor-pointer' : ''}
                `} style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                </div>
                <p className={`mt-2 text-3xl font-semibold ${stat.color}`}>
                  <AnimatedNumber value={stat.value} />
                </p>
              </Card>
            </WrapperComponent>
          );
        })}
      </div>

       <Card className={`
          transform transition-all duration-500 ease-out
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `} style={{ transitionDelay: `400ms` }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Báo Cáo Doanh Thu</h2>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                      <button title="Biểu đồ cột" onClick={() => setChartType('bar')} className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                          <BarChartIconSvg />
                      </button>
                      <button title="Biểu đồ đường" onClick={() => setChartType('line')} className={`p-1.5 rounded-md transition-colors ${chartType === 'line' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                          <LineChartIconSvg />
                      </button>
                      <button title="Biểu đồ miền" onClick={() => setChartType('area')} className={`p-1.5 rounded-md transition-colors ${chartType === 'area' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                          <AreaChartIconSvg />
                      </button>
                  </div>
                  <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                      <button onClick={() => setRevenueView('week')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${revenueView === 'week' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tuần</button>
                      <button onClick={() => setRevenueView('month')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${revenueView === 'month' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tháng</button>
                      <button onClick={() => setRevenueView('year')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${revenueView === 'year' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Năm</button>
                  </div>
              </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <>
                {chartType === 'bar' && (
                  <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}/>
                    <Tooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} content={<CustomTooltip />}/>
                    {/* FIX: Correctly format legend to display series name instead of x-axis label. */}
                    <Legend formatter={(value) => <span className="text-gray-800 dark:text-white">{value}</span>} />
                    <Bar dataKey="DoanhThu" name="Doanh Thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
                {chartType === 'line' && (
                  <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}/>
                    <Tooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} content={<CustomTooltip />}/>
                    {/* FIX: Correctly format legend to display series name instead of x-axis label. */}
                    <Legend formatter={(value) => <span className="text-gray-800 dark:text-white">{value}</span>} />
                    <Line type="monotone" dataKey="DoanhThu" name="Doanh Thu" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}/>
                  </LineChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorDoanhThu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}/>
                    <Tooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} content={<CustomTooltip />}/>
                    {/* FIX: Correctly format legend to display series name instead of x-axis label. */}
                    <Legend formatter={(value) => <span className="text-gray-800 dark:text-white">{value}</span>} />
                    <Area type="monotone" dataKey="DoanhThu" name="Doanh Thu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDoanhThu)" />
                  </AreaChart>
                )}
              </>
            </ResponsiveContainer>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className={`
          transform transition-all duration-500 ease-out
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `} style={{ transitionDelay: `500ms` }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Món Đồ Được Thuê Nhiều Nhất (Hiện tại)</h2>
          {mostPopularItems.length > 0 ? (
            <ul className="space-y-4">
              {mostPopularItems.map(item => (
                <li key={item.id} className="flex items-center space-x-4">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Số lượng đang thuê: {rentedItemCounts.get(item.id) || 0}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có món đồ nào đang được thuê.</p>
          )}
        </Card>

        <Card className={`
          transform transition-all duration-500 ease-out
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `} style={{ transitionDelay: `600ms` }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Top 5 Khách Hàng Chi Tiêu Nhiều Nhất (Năm nay)</h2>
          {topSpendingCustomers.length > 0 ? (
            <ul className="space-y-4">
              {topSpendingCustomers.map(customer => (
                <li key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     <UserCircleIcon className="h-8 w-8 text-gray-400"/>
                     <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                  </div>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {customer.totalSpent.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu chi tiêu trong năm nay.</p>
          )}
        </Card>

        <Card className={`lg:col-span-2
          transform transition-all duration-500 ease-out
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `} style={{ transitionDelay: `700ms` }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Lượt Thuê Quá Hạn</h2>
          {overdueRentals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món Đồ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày Hẹn Trả</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {overdueRentals.slice(0, 5).map(rental => (
                    <tr key={rental.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {rental.rentedItems.map(({ itemId, quantity }) => {
                            const item = clothingItemMap.get(itemId);
                            return `${item?.name || 'N/A'} (x${quantity})`;
                        }).join(', ')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-medium">
                        {format(parseISO(rental.dueDate), 'dd/MM/yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Không có lượt thuê nào quá hạn.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
