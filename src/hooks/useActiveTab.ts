import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export type ActiveTab = 
  | 'overview' 
  | 'areas' 
  | 'feedbacks' 
  | 'agente-ia' 
  | 'escritorio' 
  | 'usuarios-admin' 
  | 'base-conhecimento' 
  | 'planos' 
  | 'assinatura';

export function useActiveTab(): ActiveTab {
  const pathname = usePathname();
  
  return useMemo(() => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'overview';
      case '/areas':
        return 'areas';
      case '/feedbacks':
        return 'feedbacks';
      case '/agente-ia':
        return 'agente-ia';
      case '/escritorio':
        return 'escritorio';
      case '/usuarios-admin':
        return 'usuarios-admin';
      case '/base-conhecimento':
        return 'base-conhecimento';
      case '/planos':
        return 'planos';
      case '/assinatura':
        return 'assinatura';
      default:
        // Para rotas dinâmicas como /areas/[areaId], retorna 'areas'
        if (pathname.startsWith('/areas/')) {
          return 'areas';
        }
        if (pathname.startsWith('/feedbacks/')) {
          return 'feedbacks';
        }
        return 'overview';
    }
  }, [pathname]);
}
