<script lang="ts">
  export let data;
  const { galleries } = data;
</script>

<svelte:head>
  <title>Gallery</title>
</svelte:head>

<main>
  <h1>Gallery</h1>
  <p>Foto-foto dari grain.social saya</p>

  {#if galleries.length === 0}
    <p>Belum ada gallery.</p>
  {:else}
    <div class="grid">
      {#each galleries as gallery}
        {@const value = gallery.value}
        
          href="https://grain.social/gallery/{gallery.uri.split('/').pop()}"
          target="_blank"
          rel="noopener"
          class="card"
        >
          {#if value.images?.[0]?.image}
            <img
              src="https://cdn.bsky.app/img/feed_thumbnail/plain/{gallery.uri.split('/')[2]}/{value.images[0].image.ref.$link}@jpeg"
              alt={value.title ?? 'Gallery'}
            />
          {/if}
          <p>{value.title ?? 'Untitled'}</p>
        </a>
      {/each}
    </div>
  {/if}
</main>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .card {
    text-decoration: none;
    color: inherit;
  }
  .card img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
  }
</style>
