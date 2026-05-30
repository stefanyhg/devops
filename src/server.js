import { app, initDatabase } from "./app.js";

const PORT = process.env.PORT || 8080;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error inicializando la base de datos", error);
    process.exit(1);
  });