import { useState, useCallback } from 'react';
import type { Consulta, DetalleConsulta } from '@/types';
import { consultasPendientes, consultasHistoricas, catalogo } from '@/data/mockData';

export function useConsultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([...consultasPendientes, ...consultasHistoricas]);
  const [isLoading] = useState(false);

  const getConsultasPendientes = useCallback((): Consulta[] => {
    return consultas.filter(c => c.estado === 'pendiente');
  }, [consultas]);

  const getConsultasPorMascota = useCallback((mascotaId: string): Consulta[] => {
    return consultas.filter(c => c.mascotaId === mascotaId).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [consultas]);

  const finalizarConsulta = useCallback((consultaId: string): boolean => {
    setConsultas(prev => prev.map(c => 
      c.id === consultaId ? { ...c, estado: 'finalizado' } : c
    ));
    return true;
  }, []);

  const crearConsulta = useCallback((consultaData: Partial<Consulta>): Consulta => {
    const nuevaConsulta: Consulta = {
      id: `c${Date.now()}`,
      mascotaId: consultaData.mascotaId || '',
      fecha: new Date().toISOString(),
      motivo: consultaData.motivo || '',
      sintomas: consultaData.sintomas || '',
      diagnostico: consultaData.diagnostico || '',
      tratamiento: consultaData.tratamiento || '',
      notas: consultaData.notas || '',
      doctora: 'Dra. Maritza López',
      estado: 'pendiente',
      total: consultaData.total || 0,
      detalles: consultaData.detalles || [],
      proximaCita: consultaData.proximaCita
    };
    
    setConsultas(prev => [nuevaConsulta, ...prev]);
    return nuevaConsulta;
  }, []);

  const calcularTotal = useCallback((detalles: DetalleConsulta[]): number => {
    return detalles.reduce((sum, d) => sum + d.subtotal, 0);
  }, []);

  return {
    consultas,
    isLoading,
    getConsultasPendientes,
    getConsultasPorMascota,
    finalizarConsulta,
    crearConsulta,
    calcularTotal
  };
}

export function useCatalogo() {
  const [productos, setProductos] = useState(catalogo);

  const getProductosPorCategoria = useCallback((categoria: string) => {
    return productos.filter(p => p.categoria === categoria && p.activo);
  }, [productos]);

  const buscarProductos = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return productos.filter(p => 
      p.activo && (
        p.nombre.toLowerCase().includes(lowerQuery) ||
        p.codigo.toLowerCase().includes(lowerQuery) ||
        p.descripcion.toLowerCase().includes(lowerQuery)
      )
    );
  }, [productos]);

  const actualizarProducto = useCallback((id: string, data: Partial<typeof catalogo[0]>) => {
    setProductos(prev => prev.map(p => 
      p.id === id ? { ...p, ...data } : p
    ));
  }, []);

  const crearProducto = useCallback((data: Omit<typeof catalogo[0], 'id'>) => {
    const nuevoProducto = {
      ...data,
      id: `prod${Date.now()}`
    };
    setProductos(prev => [...prev, nuevoProducto]);
    return nuevoProducto;
  }, []);

  const eliminarProducto = useCallback((id: string) => {
    setProductos(prev => prev.map(p => 
      p.id === id ? { ...p, activo: false } : p
    ));
  }, []);

  return {
    productos,
    getProductosPorCategoria,
    buscarProductos,
    actualizarProducto,
    crearProducto,
    eliminarProducto
  };
}
