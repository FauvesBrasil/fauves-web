import React from 'react';
import Header from '@/components/Header';
import LocationSelector from '@/components/LocationSelector';
import SearchBar from '@/components/SearchBar';
import CategoryTags from '@/components/CategoryTags';
import EventsGrid from '@/components/EventsGrid';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';

const Index = () => {
  const upcomingEvents = [
    {
      id: '1',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '2',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '3',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '4',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '5',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '6',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '7',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '8',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/802e4503c79dd76b2c66434bc408131047cb63e9?width=490',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    }
  ];

  const brazilEvents = [
    {
      id: '9',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/c03ad79281c74bdee93488f6237bf35fff85a59e?width=312',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '10',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/3620617265758ae8a9fbdf62b58f50a618fa8890?width=312',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '11',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/101a1ce40f3570b0cfd95f5059058fddb82e0031?width=312',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '12',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/c03ad79281c74bdee93488f6237bf35fff85a59e?width=312',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '13',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/3620617265758ae8a9fbdf62b58f50a618fa8890?width=312',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    },
    {
      id: '14',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/101a1ce40f3570b0cfd95f5059058fddb82e0031?width=312',
      date: '22 Janeiro 2025',
      title: 'Nome do evento',
      location: 'Fortaleza, CE'
    }
  ];

  return (
    <div className="w-full max-w-[1352px] relative bg-white mx-auto my-0 rounded-[20px] max-md:max-w-full max-md:m-0">
      <Header />
      
      <main>
        <section className="relative px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
          <h1 className="text-[#091747] text-sm font-bold mb-[15px] max-sm:text-xs">
            Melhores eventos em
          </h1>
          
          <div className="flex items-center gap-4 max-md:flex-col max-md:items-start">
            <LocationSelector />
            <SearchBar />
          </div>
        </section>

        <section className="px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
          <h2 className="text-[#091747] text-lg font-bold mb-5 max-sm:text-base">
            🧭 Explore nossas coleções
          </h2>
          <CategoryTags />
        </section>

        <EventsGrid 
          title="🎉 Próximos eventos"
          events={upcomingEvents}
          size="large"
        />

        <EventsGrid 
          title="🦜 Pelo Brasil..."
          events={brazilEvents}
          size="small"
        />

        <Banner />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
