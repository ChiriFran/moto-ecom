import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToProducts } from '../services/products';
import { getAllCategories } from '../services/categories';
import { slugify } from '../utils/slugify';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/ui/Spinner';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  const sectionsRef = useRef([]);

  const activeCategory = searchParams.get('categoria') || '';
  const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.nombre || activeCategory;
  const activeCategorySlug = slugify(activeCategoryName);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionsRef.current.filter(Boolean);
    const frameId = requestAnimationFrame(() => {
      elements.forEach((element) => {
        observer.observe(element);

        const { top, bottom } = element.getBoundingClientRect();
        if (top < window.innerHeight && bottom > 0) {
          element.classList.add('is-visible');
        }
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const addSectionRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts((productsData) => {
      setProducts(productsData.filter((p) => p.activo));
      setLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setLoading(false);
    });
    getAllCategories().then(setCategories);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeCategory]);

  useEffect(() => {
    let result = [...products];

    if (activeCategory) {
      const activeSlug = slugify(activeCategory);
      result = result.filter((p) => {
        const productSlug = slugify(p.categoria);
        return productSlug === activeSlug || productSlug === activeCategorySlug;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.descripcion.toLowerCase().includes(term) ||
          p.categoria.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        result.sort((a, b) => b.precio - a.precio);
        break;
      case 'name':
        result.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'featured':
        result.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
        break;
      default:
        result.sort((a, b) => a.orden - b.orden);
    }

    setFilteredProducts(result);
  }, [products, activeCategory, activeCategorySlug, searchTerm, sortBy]);

  const handleCategoryClick = (slug) => {
    if (slug === activeCategory) {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', slug);
    }
    setSearchParams(searchParams);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('default');
    searchParams.delete('categoria');
    setSearchParams(searchParams);
  };

  return (
    <div className="products-page">
      <section className="products-page__hero section" ref={addSectionRef}>
        <div className="container">
          <div className="products-page__hero-content">
            <span className="products-page__tag">Catálogo</span>
            <h1 className="products-page__title">Nuestra selección</h1>
            <p className="products-page__subtitle">
              Accesorios y equipamiento cuidadosamente elegidos para los motociclistas más exigentes
            </p>
          </div>
        </div>
      </section>

      <div className="products-page__content container" ref={contentRef}>
        <div className="products-page__toolbar">
          <div className="products-page__toolbar-top">
            <div className="products-page__search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="products-page__search-input"
              />
            </div>

            <button
              className="products-page__filter-toggle btn btn-ghost btn-sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="20" y2="12"/>
                <line x1="12" y1="18" x2="20" y2="18"/>
              </svg>
              Filtros
            </button>
          </div>

          <div className="products-page__toolbar-bottom">
            <select
              className="products-page__sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Ordenar por</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre</option>
              <option value="featured">Destacados</option>
            </select>

            <span className="products-page__count">
              {filteredProducts.length} productos
            </span>
          </div>
        </div>

        <div className="products-page__layout">
          <aside className={`products-page__sidebar ${filtersOpen ? 'products-page__sidebar--open' : ''}`}>
            <div className="products-page__sidebar-header">
              <h3 className="products-page__sidebar-title">Categorías</h3>
              <button className="products-page__close-filters" onClick={() => setFiltersOpen(false)}>
                ✕
              </button>
            </div>
            <div className="products-page__categories">
              <button
                className={`products-page__category-btn ${!activeCategory ? 'products-page__category-btn--active' : ''}`}
                onClick={() => { searchParams.delete('categoria'); setSearchParams(searchParams); }}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`products-page__category-btn ${activeCategory === cat.slug ? 'products-page__category-btn--active' : ''}`}
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
            {(activeCategory || searchTerm || sortBy !== 'default') && (
              <button className="products-page__clear btn btn-ghost btn-sm" onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          </aside>

          <div className="products-page__grid">
            {loading ? (
              <div className="products-page__empty">
                <Spinner />
                <p>Cargando productos...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} showDescription={false} />
              ))
            ) : (
              <div className="products-page__empty">
                <p>No se encontraron productos con los filtros seleccionados.</p>
                <button className="btn btn-outline" onClick={clearFilters}>
                  Ver todos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;