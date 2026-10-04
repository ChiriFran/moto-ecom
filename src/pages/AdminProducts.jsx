import { useState, useEffect } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../services/products';
import { getAllCategories } from '../services/categories';
import { formatPrice } from '../utils/formatPrice';
import { slugify } from '../utils/slugify';
import './AdminProducts.css';

const PLACEHOLDER_IMAGE = '/images/placeholder-product.svg';

const INITIAL_FORM = {
  nombre: '',
  slug: '',
  descripcion: '',
  descripcionCorta: '',
  categoria: '',
  precio: '',
  precioTransferencia: '',
  presentacion: '',
  especificaciones: [],
  stock: '',
  orden: '',
  activo: true,
  destacado: false,
  imagen: '',
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [usePlaceholder, setUsePlaceholder] = useState(false);
  const [specInput, setSpecInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getAllProducts(),
          getAllCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const filteredProducts = products.filter((product) => {
    const name = (product.nombre || '').toLocaleLowerCase('es-AR');
    const matchesSearch = name.includes(searchTerm.trim().toLocaleLowerCase('es-AR'));
    const matchesCategory = categoryFilter === 'todas' || product.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openFormNew = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setImageFile(null);
    setImagePreview('');
    setUsePlaceholder(true);
    setSpecInput('');
    setDrawerOpen(true);
  };

  const openFormEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre || '',
      slug: product.slug || '',
      descripcion: product.descripcion || '',
      descripcionCorta: product.descripcionCorta || '',
      categoria: product.categoria || '',
      precio: product.precio ?? '',
      precioTransferencia: product.precioTransferencia ?? '',
      presentacion: product.presentacion || '',
      especificaciones: product.especificaciones || [],
      stock: product.stock ?? '',
      orden: product.orden ?? '',
      activo: product.activo ?? true,
      destacado: product.destacado ?? false,
      imagen: product.imagen || '',
    });
    setImageFile(null);
    setImagePreview(product.imagen || '');
    setUsePlaceholder(!product.imagen);
    setSpecInput('');
    setDrawerOpen(true);
  };

  const closeForm = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setImageFile(null);
    setImagePreview('');
    setUsePlaceholder(false);
    setSpecInput('');
    setDrawerOpen(false);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'nombre' && !editingProduct) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setUsePlaceholder(false);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAddSpec = () => {
    const val = specInput.trim();
    if (!val) return;
    setFormData((prev) => ({ ...prev, especificaciones: [...prev.especificaciones, val] }));
    setSpecInput('');
  };

  const handleRemoveSpec = (index) => {
    setFormData((prev) => ({
      ...prev,
      especificaciones: prev.especificaciones.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) return alert('El nombre es obligatorio');
    if (!formData.categoria) return alert('Seleccioná una categoría');
    if (!formData.precio && formData.precio !== 0) return alert('Ingresá un precio');

    setSaving(true);
    try {
      let imageUrl = formData.imagen;

      if (usePlaceholder) {
        imageUrl = '';
      } else if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${formData.slug || Date.now()}.${ext}`;
        imageUrl = await uploadProductImage(imageFile, fileName);
      }

      const productData = {
        nombre: formData.nombre.trim(),
        slug: formData.slug || slugify(formData.nombre),
        descripcion: formData.descripcion.trim(),
        descripcionCorta: formData.descripcionCorta.trim(),
        categoria: formData.categoria,
        precio: Number(formData.precio),
        precioTransferencia: formData.precioTransferencia ? Number(formData.precioTransferencia) : Number(formData.precio),
        presentacion: formData.presentacion.trim(),
        especificaciones: formData.especificaciones,
        stock: formData.stock !== '' ? Number(formData.stock) : 0,
        orden: formData.orden !== '' ? Number(formData.orden) : 0,
        activo: formData.activo,
        destacado: formData.destacado,
        imagen: imageUrl,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...productData } : p))
        );
      } else {
        const newId = await createProduct(productData);
        setProducts((prev) => [...prev, { id: newId, ...productData }]);
      }

      closeForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  if (loading) {
    return <p className="admin-products__loading">Cargando productos...</p>;
  }

  return (
    <div className="admin-products">
      <div className="admin-products__toolbar">
        <label className="admin-products__search-label" htmlFor="admin-product-search">Buscar</label>
        <input
          id="admin-product-search"
          className="admin-products__search"
          type="search"
          placeholder="Nombre del producto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="admin-products__filter"
          aria-label="Filtrar por categoría"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" type="button" onClick={openFormNew}>
          + Nuevo
        </button>
      </div>

      <p className="admin-products__count">{filteredProducts.length} productos</p>

      {/* Tabla desktop */}
      <div className="admin-products__table-wrapper">
        <table className="admin-products__table">
          <thead>
            <tr>
              <th className="admin-products__th-img">Foto</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Transf.</th>
              <th>Stock</th>
              <th>Activo</th>
              <th>Destacado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={9} className="admin-products__empty">No hay productos que coincidan.</td></tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className={!product.activo ? 'admin-products__row--inactive' : ''}>
                  <td>
                    <img
                      className="admin-products__thumb"
                      src={product.imagen || PLACEHOLDER_IMAGE}
                      alt={product.nombre}
                      onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                  </td>
                  <td className="admin-products__td-name">{product.nombre}</td>
                  <td>{product.categoria}</td>
                  <td>{formatPrice(product.precio)}</td>
                  <td>{formatPrice(product.precioTransferencia)}</td>
                  <td className="admin-products__td-stock">{product.stock}</td>
                  <td>
                    <span className={`admin-products__badge ${product.activo ? 'admin-products__badge--on' : 'admin-products__badge--off'}`}>
                      {product.activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>
                    {product.destacado && <span className="admin-products__badge admin-products__badge--featured">★</span>}
                  </td>
                  <td className="admin-products__actions">
                    <button className="admin-products__action-btn" title="Editar" onClick={() => openFormEdit(product)}>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    </button>
                    <button className="admin-products__action-btn admin-products__action-btn--delete" title="Eliminar" onClick={() => handleDelete(product)}>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="admin-products__cards">
        {filteredProducts.length === 0 ? (
          <p className="admin-products__empty">No hay productos que coincidan.</p>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className={`admin-products__card ${!product.activo ? 'admin-products__card--inactive' : ''}`}>
              <img
                className="admin-products__card-img"
                src={product.imagen || PLACEHOLDER_IMAGE}
                alt={product.nombre}
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
              <div className="admin-products__card-body">
                <div className="admin-products__card-header">
                  <span className="admin-products__card-name">{product.nombre}</span>
                  <span className={`admin-products__badge ${product.activo ? 'admin-products__badge--on' : 'admin-products__badge--off'}`}>
                    {product.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <span className="admin-products__card-cat">{product.categoria}</span>
                <div className="admin-products__card-prices">
                  <span>{formatPrice(product.precio)}</span>
                  <span className="admin-products__card-transfer">Transf: {formatPrice(product.precioTransferencia)}</span>
                </div>
                <span className="admin-products__card-stock">Stock: {product.stock}</span>
                <div className="admin-products__card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openFormEdit(product)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Backdrop */}
      <div
        className={`admin-products__backdrop ${drawerOpen ? 'admin-products__backdrop--open' : ''}`}
        onClick={closeForm}
      />

      {/* Drawer formulario */}
      <div className={`admin-products__drawer ${drawerOpen ? 'admin-products__drawer--open' : ''}`}>
        <div className="admin-products__drawer-header">
          <h2>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button className="admin-products__drawer-close" onClick={closeForm}>✕</button>
        </div>

        <div className="admin-products__drawer-content">
          {/* Imagen */}
          <div className="admin-products__field">
            <label className="admin-products__label">Imagen</label>
            <div className="admin-products__image-area">
              <img
                className="admin-products__image-preview"
                src={imagePreview || PLACEHOLDER_IMAGE}
                alt="Preview"
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
              <div className="admin-products__image-buttons">
                <label className="btn btn-outline btn-sm admin-products__image-upload">
                  Elegir archivo
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </label>
                <button
                  type="button"
                  className={`btn btn-sm ${usePlaceholder ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setUsePlaceholder(true); setImageFile(null); setImagePreview(''); }}
                >
                  Sin foto
                </button>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div className="admin-products__field">
            <label className="admin-products__label" htmlFor="prod-nombre">Nombre *</label>
            <input
              id="prod-nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>

          {/* Slug */}
          <div className="admin-products__field">
            <label className="admin-products__label" htmlFor="prod-slug">Slug</label>
            <input
              id="prod-slug"
              type="text"
              value={formData.slug}
              onChange={(e) => handleFormChange('slug', e.target.value)}
              placeholder="url-del-producto"
            />
          </div>

          {/* Categoría */}
          <div className="admin-products__field">
            <label className="admin-products__label" htmlFor="prod-categoria">Categoría *</label>
            <select
              id="prod-categoria"
              value={formData.categoria}
              onChange={(e) => handleFormChange('categoria', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Descripción corta */}
          <div className="admin-products__field">
            <label className="admin-products__label" htmlFor="prod-desc-corta">Descripción corta</label>
            <input
              id="prod-desc-corta"
              type="text"
              value={formData.descripcionCorta}
              onChange={(e) => handleFormChange('descripcionCorta', e.target.value)}
              placeholder="Una línea resumen"
            />
          </div>

          {/* Descripción */}
          <div className="admin-products__field">
            <label className="admin-products__label" htmlFor="prod-descripcion">Descripción</label>
            <textarea
              id="prod-descripcion"
              rows={3}
              value={formData.descripcion}
              onChange={(e) => handleFormChange('descripcion', e.target.value)}
              placeholder="Descripción completa del producto"
            />
          </div>

          {/* Precios */}
          <div className="admin-products__row">
            <div className="admin-products__field">
              <label className="admin-products__label" htmlFor="prod-precio">Precio *</label>
              <input
                id="prod-precio"
                type="number"
                min="0"
                value={formData.precio}
                onChange={(e) => handleFormChange('precio', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="admin-products__field">
              <label className="admin-products__label" htmlFor="prod-precio-transf">Precio transferencia</label>
              <input
                id="prod-precio-transf"
                type="number"
                min="0"
                value={formData.precioTransferencia}
                onChange={(e) => handleFormChange('precioTransferencia', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Presentación y Stock */}
          <div className="admin-products__row">
            <div className="admin-products__field">
              <label className="admin-products__label" htmlFor="prod-presentacion">Presentación</label>
              <input
                id="prod-presentacion"
                type="text"
                value={formData.presentacion}
                onChange={(e) => handleFormChange('presentacion', e.target.value)}
                placeholder="Talle M"
              />
            </div>
            <div className="admin-products__field">
              <label className="admin-products__label" htmlFor="prod-stock">Stock</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleFormChange('stock', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Orden */}
          <div className="admin-products__field">
            <label className="admin-products__label" htmlFor="prod-orden">Orden</label>
            <input
              id="prod-orden"
              type="number"
              min="0"
              value={formData.orden}
              onChange={(e) => handleFormChange('orden', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Especificaciones */}
          <div className="admin-products__field">
            <label className="admin-products__label">Especificaciones</label>
            <div className="admin-products__ingredient-input">
              <input
                type="text"
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpec(); } }}
                placeholder="Agregar especificación"
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={handleAddSpec}>+</button>
            </div>
            {formData.especificaciones.length > 0 && (
              <ul className="admin-products__ingredient-list">
                {formData.especificaciones.map((ing, i) => (
                  <li key={i} className="admin-products__ingredient-tag">
                    {ing}
                    <button type="button" onClick={() => handleRemoveSpec(i)}>✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Checkboxes */}
          <div className="admin-products__checks">
            <label className="admin-products__check">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => handleFormChange('activo', e.target.checked)}
              />
              Activo
            </label>
            <label className="admin-products__check">
              <input
                type="checkbox"
                checked={formData.destacado}
                onChange={(e) => handleFormChange('destacado', e.target.checked)}
              />
              Destacado
            </label>
          </div>

          {/* Botones */}
          <div className="admin-products__drawer-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="btn btn-outline btn-sm" type="button" onClick={closeForm}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
