// CineMatch JavaScript — TMDB + Firebase
const API_KEY = "56d6e15266e5f7bac879f7ee7ecf9553";
const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const PROFILE_URL = "https://image.tmdb.org/t/p/w185";
const PLACEHOLDER = "https://placehold.co/300x450/102522/ffffff?text=No+Poster";

let currentMovieRequest = 0;
let currentDetailsRequest = 0;
let currentMovieList = [];
let auth = null;
let db = null;

const firebaseConfig = {
  apiKey: "AIzaSyCyMC0qRRtHVfkmNhxN_w1coWmdi5vi680",
  authDomain: "cinematch-82e08.firebaseapp.com",
  projectId: "cinematch-82e08",
  storageBucket: "cinematch-82e08.firebasestorage.app",
  messagingSenderId: "262139517198",
  appId: "1:262139517198:web:73e5640d6a099b33cc9f5f",
  measurementId: "G-YWYP1ZW46T"
};

function byId(id) {
  return document.getElementById(id);
}

function safeText(value, fallback = "") {
  return value == null || value === "" ? fallback : String(value);
}

async function tmdb(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(
    `${API_URL}${path}${separator}api_key=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`);
  }

  return response.json();
}

function makeMovieCard(movie, options = {}) {
  const card = document.createElement("article");
  card.className = options.discovery ? "discovery-card" : "movie-card";
  card.tabIndex = 0;

  const poster = document.createElement("img");
  poster.src = movie.poster_path
    ? IMAGE_URL + movie.poster_path
    : PLACEHOLDER;
  poster.alt = `${safeText(movie.title, "Movie")} poster`;
  poster.loading = "lazy";
  card.appendChild(poster);

  const title = document.createElement("h3");
  title.textContent = safeText(movie.title, "Untitled");
  card.appendChild(title);

  const rating = document.createElement("p");
  rating.textContent =
    `⭐ ${Number(movie.vote_average || 0).toFixed(1)}/10`;
  card.appendChild(rating);

  if (movie.release_date) {
    const date = document.createElement("p");
    date.textContent = `📅 ${movie.release_date}`;
    card.appendChild(date);
  }

  if (options.actions !== false) {
    const fav = document.createElement("button");
    fav.type = "button";
    fav.textContent = "❤️ Add to Favorites";

    fav.onclick = event => {
      event.stopPropagation();
      window.addToFavorites(movie);
    };

    card.appendChild(fav);

    const watch = document.createElement("button");
    watch.type = "button";
    watch.textContent = "📌 Add to Watchlist";

    watch.onclick = event => {
      event.stopPropagation();
      window.addToWatchlist(movie);
    };

    card.appendChild(watch);
  }

  const details = document.createElement("button");
  details.type = "button";
  details.textContent = "View Details";

  details.onclick = event => {
    event.stopPropagation();
    showMovieDetails(movie.id);
  };

  card.appendChild(details);

  card.addEventListener("click", event => {
    if (
      event.target === card ||
      event.target === poster ||
      event.target === title
    ) {
      showMovieDetails(movie.id);
    }
  });

  card.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      showMovieDetails(movie.id);
    }
  });

  return card;
}

async function loadMovies(query = "") {
  const container = byId("movies");
  const details = byId("movie-details");

  if (!container || !details) return;

  const requestId = ++currentMovieRequest;
  currentDetailsRequest++;

  details.hidden = true;
  details.innerHTML = "";
  details.style.display = "none";

  container.hidden = false;
  container.style.display = "grid";
  container.innerHTML = "<p>Loading movies...</p>";

  try {
    const endpoint = query.trim()
      ? `/search/movie?query=${encodeURIComponent(query.trim())}`
      : "/movie/popular";

    const data = await tmdb(endpoint);

    if (requestId !== currentMovieRequest) return;

    currentMovieList = data.results || [];
    container.innerHTML = "";

    if (!currentMovieList.length) {
      container.innerHTML =
        "<p>No movies found. Try another search.</p>";
      return;
    }

    currentMovieList.forEach(movie => {
      container.appendChild(makeMovieCard(movie));
    });

  } catch (error) {
    if (requestId !== currentMovieRequest) return;

    console.error("Movie loading error:", error);

    container.innerHTML =
      `<p>Unable to load movies: ${safeText(error.message)}</p>`;
  }
}

function searchMovie() {
  const input = byId("search");
  loadMovies(input ? input.value : "");
}

async function showMovieDetails(movieId) {
  const details = byId("movie-details");
  const movies = byId("movies");

  if (!details || !movies) return;

  const requestId = ++currentDetailsRequest;
  currentMovieRequest++;

  details.hidden = false;
  details.style.display = "block";

  movies.hidden = true;
  movies.style.display = "none";

  details.innerHTML =
    "<p class='loading-message'>Loading movie details...</p>";

  details.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  try {
    const [movie, credits, videos] = await Promise.all([
      tmdb(`/movie/${movieId}?language=en-US`),
      tmdb(`/movie/${movieId}/credits`),
      tmdb(`/movie/${movieId}/videos`)
    ]);

    if (requestId !== currentDetailsRequest) return;

    const director = (credits.crew || []).find(
      p => p.job === "Director"
    );

    const writers = (credits.crew || [])
      .filter(p =>
        ["Writer", "Screenplay", "Story"].includes(p.job)
      )
      .map(p => p.name);

    const trailer =
      (videos.results || []).find(v =>
        v.site === "YouTube" &&
        v.type === "Trailer" &&
        v.official
      ) ||
      (videos.results || []).find(v =>
        v.site === "YouTube" &&
        v.type === "Trailer"
      );

    details.innerHTML = "";

    const back = document.createElement("button");
    back.className = "cinema-back-button";
    back.textContent = "← Back to Movies";

    back.onclick = () => {
      details.hidden = true;
      details.style.display = "none";

      movies.hidden = false;
      movies.style.display = "grid";

      details.innerHTML = "";

      window.scrollTo({
        top: movies.offsetTop - 15,
        behavior: "smooth"
      });
    };

    details.appendChild(back);

    const hero = document.createElement("div");
    hero.className = "cinema-hero";

    if (movie.backdrop_path) {
      hero.style.backgroundImage =
        `linear-gradient(90deg,rgba(3,15,15,.94),rgba(3,15,15,.55)),url("https://image.tmdb.org/t/p/original${movie.backdrop_path}")`;
    }

    const heroContent = document.createElement("div");
    heroContent.className = "cinema-hero-content";

    const poster = document.createElement("img");
    poster.className = "cinema-main-poster";
    poster.src = movie.poster_path
      ? IMAGE_URL + movie.poster_path
      : PLACEHOLDER;
    poster.alt = `${movie.title} poster`;

    heroContent.appendChild(poster);

    const info = document.createElement("div");
    info.className = "cinema-main-info";

    const title = document.createElement("h1");
    title.textContent = movie

    const actions = document.createElement("div");
    actions.className = "cinema-actions";
    if (trailer) {
      const trailerLink = document.createElement("a");
      trailerLink.className = "cinema-trailer-button";
      trailerLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`;
      trailerLink.target = "_blank";
      trailerLink.rel = "noopener noreferrer";
      trailerLink.textContent = "▶ Watch Trailer";
      actions.appendChild(trailerLink);
    }
    const watchButton = document.createElement("button");
    watchButton.className = "cinema-watch-button";
    watchButton.textContent = "📌 Add to Watchlist";
    watchButton.onclick = () => window.addToWatchlist(movie);
    actions.appendChild(watchButton);

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "cinema-favorite-button";
    favoriteButton.textContent = "❤️ Add to Favorites";
    favoriteButton.onclick = () => window.addToFavorites(movie);
    actions.appendChild(favoriteButton);

    info.appendChild(actions);
    heroContent.appendChild(info);
    hero.appendChild(heroContent);
    details.appendChild(hero);

    addSectionTitle(details, "About the Movie");
    const overview = document.createElement("p");
    overview.className = "cinema-overview";
    overview.textContent = movie.overview || "No overview available.";
    details.appendChild(overview);

    const crewBox = document.createElement("div");
    crewBox.className = "cinema-crew-info";
    const directorText = document.createElement("p");
    directorText.innerHTML = "<strong>Director</strong><br>";
    directorText.append(document.createTextNode(director ? director.name : "Unknown"));
    crewBox.appendChild(directorText);
    const writerText = document.createElement("p");
    writerText.innerHTML = "<strong>Writers</strong><br>";
    writerText.append(document.createTextNode(writers.join(", ") || "Unavailable"));
    crewBox.appendChild(writerText);
    details.appendChild(crewBox);

    addSectionTitle(details, "Cast & Actors");
    const castList = document.createElement("div");
    castList.className = "cinema-cast-list";
    (credits.cast || []).slice(0, 12).forEach(person => {
      const card = document.createElement("div");
      card.className = "cinema-cast-card";
      const image = document.createElement("img");
      image.src = person.profile_path ? PROFILE_URL + person.profile_path :
        "https://placehold.co/150x190/102522/ffffff?text=No+Photo";
      image.alt = person.name || "Cast member";
      image.loading = "lazy";
      card.appendChild(image);
      const name = document.createElement("h4");
      name.textContent = person.name || "Unknown";
      card.appendChild(name);
      const character = document.createElement("p");
      character.textContent = person.character || "";
      card.appendChild(character);
      castList.appendChild(card);
    });
    details.appendChild(castList);

    addSectionTitle(details, "Behind the Film");
    const crewGrid = document.createElement("div");
    crewGrid.className = "cinema-key-crew";
    (credits.crew || []).filter(p =>
      ["Producer", "Editor", "Composer", "Director of Photography"].includes(p.job)
    ).slice(0, 8).forEach(person => {
      const card = document.createElement("div");
      card.className = "cinema-key-crew-card";
      const strong = document.createElement("strong");
      strong.textContent = person.job;
      const name = document.createElement("p");
      name.textContent = person.name;
      card.append(strong, name);
      crewGrid.appendChild(card);
    });
    details.appendChild(crewGrid);

    addSectionTitle(details, "⭐ Audience Reviews");
    const reviewSection = document.createElement("div");
    reviewSection.id = "reviewSection";
    reviewSection.className = "cinema-review-section";
    const label = document.createElement("label");
    label.htmlFor = "reviewRating";
    label.textContent = "Rate this movie:";
    reviewSection.appendChild(label);
    const rating = document.createElement("select");
    rating.id = "reviewRating";
    for (let i = 5; i >= 1; i--) {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = `${"⭐".repeat(i)} (${i}/5)`;
      rating.appendChild(option);
    }
    reviewSection.appendChild(rating);
    const reviewInput = document.createElement("textarea");
    reviewInput.id = "reviewText";
    reviewInput.maxLength = 1000;
    reviewInput.placeholder = "Write your review...";
    reviewSection.appendChild(reviewInput);
    const submit = document.createElement("button");
    submit.type = "button";
    submit.textContent = "Submit Review";
    submit.onclick = () => window.submitMovieReview(movie.id);
    reviewSection.appendChild(submit);
    const reviews = document.createElement("div");
    reviews.id = "reviewsList";
    reviewSection.appendChild(reviews);
    details.appendChild(reviewSection);

    if (window.loadMovieReviews) window.loadMovieReviews(movie.id);
  } catch (error) {
    if (requestId !== currentDetailsRequest) return;
    console.error("Movie details error:", error);
    details.innerHTML = "";
    const message = document.createElement("p");
    message.textContent = `Unable to load movie details: ${error.message}`;
    details.appendChild(message);
    const retry = document.createElement("button");
    retry.textContent = "Try Again";
    retry.onclick = () => showMovieDetails(movieId);
    details.appendChild(retry);
    const back = document.createElement("button");
    back.textContent = "← Back to Movies";
    back.onclick = () => {
      details.hidden = true;
      movies.hidden = false;
      movies.style.display = "grid";
    };
    details.appendChild(back);
  }
}

function addSectionTitle(parent, text) {
  const heading = document.createElement("h2");
  heading.className = "cinema-section-title";
  heading.textContent = text;
  parent.appendChild(heading);
}

async function loadTrendingMovies(timeWindow = "day") {
  const container = byId("trendingMovies");
  if (!container) return;
  container.innerHTML = "<p>Loading trending movies...</p>";
  document.querySelectorAll(".trending-tabs button").forEach(button => button.classList.remove("active"));
  const buttons = document.querySelectorAll(".trending-tabs button");
  if (buttons[timeWindow === "day" ? 0 : 1]) buttons[timeWindow === "day" ? 0 : 1].classList.add("active");
  try {
    const data = await tmdb(`/trending/movie/${timeWindow}`);
    container.innerHTML = "";
    (data.results || []).slice(0, 10).forEach(movie => {
      const card = makeMovieCard(movie, { discovery: true, actions: false });
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Trending movies error:", error);
    container.textContent = "Unable to load trending movies.";
  }
}

async function loadUpcomingMovies() {
  const container = byId("upcomingMovies");
  if (!container) return;
  container.innerHTML = "<p>Loading upcoming movies...</p>";
  try {
    const today = new Date().toISOString().slice(0, 10);
    const data = await tmdb(`/discover/movie?sort_by=popularity.desc&include_adult=false&primary_release_date.gte=${today}&region=IN`);
    container.innerHTML = "";
    (data.results || []).slice(0, 5).forEach(movie => {
      container.appendChild(makeMovieCard(movie, { discovery: true, actions: false }));
    });
    if (!data.results || !data.results.length) container.textContent = "No upcoming movies found.";
  } catch (error) {
    console.error("Upcoming movies error:", error);
    container.textContent = "Unable to load upcoming movies.";
  }
}

function toggleLanguageMenu() {
  const menu = byId("languageMenu");
  if (menu) menu.hidden = !menu.hidden;
}

function applyLanguageFilter() {
  const select = byId("movieLanguage");
  const language = select ? select.value : "all";
  const params = new URLSearchParams({
    sort_by: "popularity.desc",
    include_adult: "false",
    page: "1"
  });
  if (language !== "all") {
    params.set("with_original_language", language);
    if (["hi", "kn", "te", "ta", "ml", "bn", "mr", "pa", "gu", "ur"].includes(language)) {
      params.set("with_origin_country", "IN");
    }
  }
  const menu = byId("languageMenu");
  if (menu) menu.hidden = true;
  loadDiscoveredMovies(params.toString());
}

async function loadDiscoveredMovies(params) {
  const container = byId("movies");
  const details = byId("movie-details");
  const requestId = ++currentMovieRequest;
  currentDetailsRequest++;
  details.hidden = true;
  details.style.display = "none";
  container.hidden = false;
  container.style.display = "grid";
  container.innerHTML = "<p>Loading movies...</p>";
  try {
    const data = await tmdb(`/discover/movie?${params}`);
    if (requestId !== currentMovieRequest) return;
    currentMovieList = data.results || [];
    container.innerHTML = "";
    if (!currentMovieList.length) {
      container.textContent = "No movies found for this language.";
      return;
    }
    currentMovieList.forEach(movie => container.appendChild(makeMovieCard(movie)));
  } catch (error) {
    if (requestId !== currentMovieRequest) return;
    console.error("Language filter error:", error);
    container.textContent = "Unable to load movies. Please try again.";
  }
}

function loadFirebaseScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Firebase SDK."));
    document.head.appendChild(script);
  });
}

async function startFirebase() {
  const message = byId("authMessage");
  try {
    await loadFirebaseScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
    await loadFirebaseScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
    await loadFirebaseScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    window.showProfile = function() {
      const user = auth.currentUser;
      if (!user) { alert("Please login first!"); return; }
      byId("profileName").textContent = user.displayName || "Not provided";
      byId("profileEmail").textContent = user.email || "Not available";
      byId("profileUID").textContent = user.uid;
      byId("profileDate").textContent = user.metadata.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString() : "Not available";
      const savedPicture = localStorage.getItem("profilePicture_" + user.uid);
      if (savedPicture) byId("profilePicture").src = savedPicture;
      byId("profileSection").hidden = false;
    };
    window.closeProfile = () => { byId("profileSection").hidden = true; };

    const profileInput = byId("profileImageInput");
    if (profileInput) {
      profileInput.addEventListener("change", event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { alert("Please select an image."); return; }
        if (file.size > 2 * 1024 * 1024) { alert("Please select an image smaller than 2 MB."); return; }
        const reader = new FileReader();
        reader.onload = () => {
          byId("profilePicture").src = reader.result;
          if (auth.currentUser) {
            try { localStorage.setItem("profilePicture_" + auth.currentUser.uid, reader.result); }
            catch (e) { alert("Image is too large to store on this device."); }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    window.addToWatchlist = async function(movie) {
      const user = auth.currentUser;
      if (!user) { alert("Please login to use your watchlist!"); return; }
      try {
        await db.collection("users").doc(user.uid).collection("watchlist").doc(String(movie.id)).set({
          movieId: movie.id, title: movie.title, poster: movie.poster_path || "",
          rating: movie.vote_average || 0, releaseDate: movie.release_date || ""
        });
        alert("📌 Movie added to your watchlist!");
      } catch (error) { console.error(error); alert("Unable to add movie to watchlist."); }
    };

    window.loadWatchlist = async function() {
      const container = byId("watchlistMovies");
      const user = auth.currentUser;
      if (!user) { container.textContent = "Please login to view your watchlist."; return; }
      container.textContent = "Loading your watchlist...";
      try {
        const snapshot = await db.collection("users").doc(user.uid).collection("watchlist").get();
        container.innerHTML = "";
        if (snapshot.empty) { container.textContent = "Your watchlist is empty."; return; }
        snapshot.forEach(doc => {
          const movie = doc.data();
          const card = document.createElement("article");
          card.className = "movie-card";
          const img = document.createElement("img");
          img.src = movie.poster ? IMAGE_URL + movie.poster : PLACEHOLDER;
          img.alt = movie.title || "Movie poster";
          card.appendChild(img);
          const title = document.createElement("h3");
          title.textContent = movie.title || "Untitled";
          card.appendChild(title);
          const rating = document.createElement("p");
          rating.textContent = `⭐ ${Number(movie.rating || 0).toFixed(1)}/10`;
          card.appendChild(rating);
          const remove = document.createElement("button");
          remove.textContent = "❌ Remove";
          remove.onclick = async () => {
            try {
              await db.collection("users").doc(user.uid).collection("watchlist").doc(doc.id).delete();
              window.loadWatchlist();
            } catch (error) { console.error(error); alert("Unable to remove this movie."); }
          };
          card.appendChild(remove);
          container.appendChild(card);
        });
      } catch (error) {
        console.error(error);
        container.textContent = "Unable to load watchlist.";
      }
    };

    window.addToFavorites = async function(movie) {
      const user = auth.currentUser;
      if (!user) { alert("Please login to add favorite movies!"); return; }
      try {
        await db.collection("users").doc(user.uid).collection("favorites").doc(String(movie.id)).set({
          movieId: movie.id, title: movie.title, poster: movie.poster_path || "",
          rating: movie.vote_average || 0, releaseDate: movie.release_date || ""
        });
        alert("❤️ Movie added to favorites!");
      } catch (error) { console.error(error); alert("Unable to save favorite movie."); }
    };

    window.submitMovieReview = async function(movieId) {
      const user = auth.currentUser;
      if (!user) { alert("Please login to write a review!"); return; }
      const ratingElement = byId("reviewRating");
      const reviewElement = byId("reviewText");
      if (!ratingElement || !reviewElement) return;
      const rating = Number(ratingElement.value);
      const review = reviewElement.value.trim();
      if (!review) { alert("Please write your review!"); return; }
      try {
        await db.collection("movieReviews").doc(String(movieId)).collection("reviews").doc(user.uid).set({
          username: user.displayName || "Movie Lover",
          rating, review,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        reviewElement.value = "";
        alert("Your review has been submitted!");
        window.loadMovieReviews(movieId);
      } catch (error) { console.error(error); alert("Unable to submit review. Check Firestore rules."); }
    };

    window.loadMovieReviews = async function(movieId) {
      const list = byId("reviewsList");
      if (!list) return;
      list.textContent = "Loading reviews...";
      try {
        const snapshot = await db.collection("movieReviews").doc(String(movieId)).collection("reviews").get();
        list.innerHTML = "";
        if (snapshot.empty) { list.textContent = "No reviews yet. Be the first!"; return; }
        snapshot.forEach(doc => {
          const data = doc.data();
          const card = document.createElement("div");
          card.className = "review-card";
          const name = document.createElement("h4");
          name.textContent = "👤 " + (data.username || "Movie Lover");
          const stars = document.createElement("p");
          stars.textContent = "⭐".repeat(Number(data.rating) || 0) + ` (${data.rating}/5)`;
          const body = document.createElement("p");
          body.textContent = data.review || "";
          card.append(name, stars, body);
          if (auth.currentUser && auth.currentUser.uid === doc.id) {
            const remove = document.createElement("button");
            remove.textContent = "🗑️ Delete My Review";
            remove.onclick = async () => {
              if (!confirm("Delete your review?")) return;
              try {
                await db.collection("movieReviews").doc(String(movieId)).collection("reviews").doc(doc.id).delete();
                window.loadMovieReviews(movieId);
              } catch (error) { console.error(error); alert("Unable to delete review."); }
            };
            card.appendChild(remove);
          }
          list.appendChild(card);
        });
      } catch (error) {
        console.error(error);
        list.textContent = "Unable to load reviews.";
      }
    };

    window.signUp = async function() {
      const username = byId("username").value.trim();
      const email = byId("email").value.trim();
      const password = byId("password").value;
      if (!username || !email || !password) { message.textContent = "Please fill all fields."; return; }
      try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: username });
        message.textContent = "Account created successfully!";
      } catch (error) { message.textContent = error.message; }
    };

    window.login = async function() {
      const email = byId("email").value.trim();
      const password = byId("password").value;
      if (!email || !password) { message.textContent = "Enter your email and password."; return; }
      try {
        await auth.signInWithEmailAndPassword(email, password);
        message.textContent = "Login successful!";
      } catch (error) { message.textContent = error.message; }
    };

    window.logout = async function() {
      try { await auth.signOut(); message.textContent = "Logged out successfully!"; }
      catch (error) { message.textContent = error.message; }
    };

    auth.onAuthStateChanged(user => {
      byId("logoutBtn").hidden = !user;
      byId("profileBtn").hidden = !user;
      if (user) message.textContent = "Welcome, " + (user.displayName || user.email);
    });
    console.log("Firebase connected successfully!");
  } catch (error) {
    console.error("Firebase error:", error);
    if (message) message.textContent = "Firebase could not load. Check your connection and live website domain.";
  }
}

window.openWatchlist = function() {
  byId("mainContent").hidden = true;
  byId("watchlist-section").hidden = false;
  byId("movie-game").hidden = true;
  if (window.loadWatchlist) window.loadWatchlist();
};
window.closeWatchlist = function() {
  byId("watchlist-section").hidden = true;
  byId("mainContent").hidden = false;
};
window.openMovieGame = function() {
  byId("mainContent").hidden = true;
  byId("watchlist-section").hidden = true;
  byId("movie-game").hidden = false;
  currentQuestion = 0;
  gameScore = 0;
  showMovieQuestion();
};
window.closeMovieGame = function() {
  byId("movie-game").hidden = true;
  byId("mainContent").hidden = false;
};

const movieQuiz = [
  {emoji:"🚢 ❤️ 🧊",answer:"Titanic",options:["Titanic","Avatar","Jaws","The Notebook"]},
  {emoji:"🦁 👑 🌅",answer:"The Lion King",options:["Madagascar","The Jungle Book","The Lion King","Tarzan"]},
  {emoji:"🕷️ 🧑 🏙️",answer:"Spider-Man",options:["Batman","Iron Man","Spider-Man","Superman"]},
  {emoji:"🧙‍♂️ ⚡ 🏰",answer:"Harry Potter",options:["Harry Potter","The Hobbit","Frozen","Doctor Strange"]},
  {emoji:"🦖 🌴 🚙",answer:"Jurassic Park",options:["King Kong","Jurassic Park","Godzilla","Jumanji"]},
  {emoji:"💙 👽 🌳",answer:"Avatar",options:["Avatar","Alien","Dune","The Martian"]},
  {emoji:"🤖 🚀 🌌",answer:"Interstellar",options:["Gravity","Interstellar","WALL-E","The Matrix"]},
  {emoji:"🐼 🥋 🐉",answer:"Kung Fu Panda",options:["Mulan","Kung Fu Panda","Shrek","Ratatouille"]},
  {emoji:"👨‍🎤 🎸 🌟",answer:"Rockstar",options:["Jersey","Rockstar","Aashiqui 2","Animal"]},
  {emoji:"🚗 💨 🏁",answer:"Fast & Furious",options:["Cars","Baby Driver","Fast & Furious","Rush"]}
];
let currentQuestion = 0;
let gameScore = 0;
let gameAnswered = false;

function showMovieQuestion() {
  const question = movieQuiz[currentQuestion];
  gameAnswered = false;
  byId("game-score").textContent = gameScore;
  byId("game-question").textContent = currentQuestion + 1;
  byId("movie-emojis").textContent = question.emoji;
  byId("game-message").textContent = "";
  byId("next-question").hidden = true;
  byId("next-question").textContent = "Next Question ➡️";
  byId("next-question").onclick = nextMovieQuestion;
  const options = byId("game-options");
  options.innerHTML = "";
  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.onclick = () => checkMovieAnswer(option, button);
    options.appendChild(button);
  });
}
function checkMovieAnswer(selected, selectedButton) {
  if (gameAnswered) return;
  gameAnswered = true;
  const question = movieQuiz[currentQuestion];
  if (selected === question.answer) {
    gameScore += 10;
    byId("game-message").textContent = "✅ Correct Answer! +10 Points";
  } else {
    byId("game-message").textContent = "❌ Correct answer: " + question.answer;
  }
  document.querySelectorAll("#game-options button").forEach(button => {
    button.disabled = true;
    if (button.textContent === question.answer) button.style.background = "#167a48";
  });
  if (selected !== question.answer) selectedButton.style.background = "#a52d4b";
  byId("game-score").textContent = gameScore;
  byId("next-question").textContent = currentQuestion === movieQuiz.length - 1 ? "🏆 See Final Score" : "Next Question ➡️";
  byId("next-question").hidden = false;
}
function nextMovieQuestion() {
  currentQuestion++;
  if (currentQuestion >= movieQuiz.length) {
    byId("movie-emojis").textContent = "🏆";
    byId("game-options").innerHTML = "";
    byId("game-message").textContent = `Game Over! Your Final Score: ${gameScore} / 100`;
    byId("next-question").textContent = "🔄 Play Again";
    byId("next-question").onclick = () => {
      currentQuestion = 0;
      gameScore = 0;
      showMovieQuestion();
    };
    return;
  }
  showMovieQuestion();
}

async function loadLoginPosters() {
  try {
    const data = await tmdb("/movie/popular");
    const posters = (data.results || []).filter(movie => movie.poster_path).slice(0, 12);
    [1,2,3].forEach(row => {
      const track = byId("posterTrack" + row);
      if (!track) return;
      const markup = posters.map(movie =>
        `<img src="${IMAGE_URL}${movie.poster_path}" alt="Movie poster" loading="lazy">`
      ).join("");
      track.innerHTML = markup + markup;
    });
  } catch (error) { console.warn("Login poster background unavailable:", error); }
}

document.addEventListener("DOMContentLoaded", () => {
  const search = byId("search");
  if (search) search.addEventListener("keydown", event => {
    if (event.key === "Enter") searchMovie();
  });
  loadMovies();
  loadTrendingMovies("day");
  loadUpcomingMovies();
  loadLoginPosters();
  startDiscoveryAutoSlide();
});

let trendingAutoSlide = null;
function startDiscoveryAutoSlide() {
    const sliders = [
        byId("trendingMovies"),
        byId("upcomingMovies")
    ];

    sliders.forEach(slider => {
        if (!slider || slider.dataset.autoSlide === "true") return;

        slider.dataset.autoSlide = "true";

        let currentIndex = 0;

        setInterval(() => {
            const cards = slider.querySelectorAll(".discovery-card");

            if (cards.length < 2) return;

            currentIndex++;

            if (currentIndex >= cards.length) {
                currentIndex = 0;
            }

            slider.scrollTo({
                left: currentIndex * slider.clientWidth,
                behavior: "smooth"
            });

        }, 4000);
    });
}

startFirebase();                                 
