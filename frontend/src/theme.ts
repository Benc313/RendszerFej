// rgba importálása a MantineTheme mellett
import { createTheme, MantineTheme, rgba } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'yellow',

  components: {
    Paper: {
       // Típus hozzáadása a theme paraméterhez
       styles: (theme: MantineTheme) => ({
         root: {
           backgroundColor: theme.colors.dark[7],
         }
       })
    },
    Title: {
        // Típus hozzáadása a theme paraméterhez
        styles: (theme: MantineTheme) => ({
            root: {
                color: theme.colors.yellow[5],
            }
        })
    },
    AppShell: {
        // Típus hozzáadása a theme paraméterhez
        styles: (theme: MantineTheme) => ({
            header: {
                backgroundColor: theme.colors.dark[8],
                borderColor: theme.colors.dark[6],
            },
            navbar: {
                backgroundColor: theme.colors.dark[8],
                borderColor: theme.colors.dark[6],
            },
        })
    },
    NavLink: {
        // Típus hozzáadása a theme paraméterhez
        styles: (theme: MantineTheme) => ({
            root: {
                '&[data-active]': {
                    // rgba közvetlen használata
                    backgroundColor: rgba(theme.colors.yellow[8], 0.2),
                    color: theme.colors.yellow[5],
                },
                '&:hover': {
                     // rgba közvetlen használata
                     backgroundColor: rgba(theme.colors.dark[5], 0.5),
                }
            }
        })
    }
  },
});