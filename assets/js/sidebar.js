document.addEventListener('DOMContentLoaded', async () => {

    try{

        // CARGAR SIDEBAR

        const respuesta = await fetch('/../component/sidebar.html');

        const sidebarHTML = await respuesta.text();

        // INSERTAR SIDEBAR

        document.getElementById('sidebar-container').innerHTML = sidebarHTML;

        // ACTIVAR LINK ACTUAL

        const currentPage = window.location.pathname.split('/').pop();

        const links = document.querySelectorAll('aside nav a');

        links.forEach(link => {

            const href = link.getAttribute('href');

            // LIMPIAR ESTILOS ACTIVOS

            link.classList.remove(
                'bg-blue-600',
                'text-white',
                'shadow-lg',
                'shadow-blue-500/20'
            );

            link.classList.add(
                'text-slate-300'
            );

            // ACTIVAR PAGINA ACTUAL

            if(href === currentPage){

                link.classList.remove('text-slate-300');

                link.classList.add(
                    'bg-blue-600',
                    'text-white',
                    'shadow-lg',
                    'shadow-blue-500/20'
                );

            }

        });

    }catch(error){

        console.error('Error cargando sidebar:', error);

    }

});


// LOGOUT GLOBAL

function logout(){

    localStorage.clear();

    window.location.href = '../pages/login.html';

}