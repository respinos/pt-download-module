<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exsl="http://exslt.org/common"
  xmlns:x="urn:x"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="exsl x"
  >

  <xsl:template name="marc2coins">
    <!-- derived from record-html.xsl from vufind source code -->

    <xsl:variable name="format" select="$gItemFormat" />

    <xsl:variable name="tmp-data">
      <x:select>
        <xsl:choose>
          <xsl:when test="$format = 'BK'">
            <x:option name="rft_val_fmt">info:ofi/fmt:kev:mtx:book</x:option>
            <x:option name="rfr_id">info:sid/hathitrust.org</x:option>
            <x:option name="rft.genre">book</x:option>
            <x:option name="rft.btitle">
              <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
              <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            </x:option>
            <x:option name="rft.au">
              <xsl:value-of select="datafield[@tag=100]/subfield[@code='a']"/>
            </x:option>
            <x:option name="rft.date">
              <xsl:value-of select="datafield[@tag=260]/subfield[@code='c']"/>
            </x:option>
            <x:option name="rft.pub">
              <xsl:value-of select="datafield[@tag=260]/subfield[@code='a']"/>
            </x:option>
            <x:option name="rft.edition">
              <xsl:value-of select="datafield[@tag=250]/subfield[@code='a']"/>
            </x:option>
            <x:option name="rft_id">
              <xsl:text>http://hdl.handle.net/2027/</xsl:text><xsl:value-of select="$gHtId"/>
            </x:option>
            <x:option name="rft.isbn">
              <xsl:value-of select="substring(datafield[@tag=020]/subfield[@code='a'], 0, 10)"/>
            </x:option>
          </xsl:when>
          <xsl:when test="$format = 'SE'">
            <x:option name="rft_val_fmt">info:ofi/fmt:kev:mtx:journal</x:option>
            <x:option name="rfr_id">info:sid/hathitrust.org</x:option>
            <x:option name="rft.genre">article</x:option>

            <x:option name="rft.title">
              <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
              <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            </x:option>

            <x:option name="rft.au">
              <xsl:value-of select="datafield[@tag=100]/subfield[@code='a']"/>
            </x:option>

            <x:option name="rft.date">
              <xsl:value-of select="datafield[@tag=260]/subfield[@code='c']"/>
            </x:option>

            <x:option name="rft_id">
              <xsl:text>http://hdl.handle.net/2027/</xsl:text><xsl:value-of select="$gHtId"/>
            </x:option>

            <x:option name="rft.issn">
              <xsl:value-of select="datafield[@tag=022]/subfield[@code='a']"/>
            </x:option>
          </xsl:when>
          <xsl:otherwise>
            <!-- unknown -->
            <x:option name="rft_val_fmt">info:ofi/fmt:kev:mtx:dc</x:option>
            <x:option name="rfr_id">info:sid/hathitrust.org</x:option>
            <x:option name="rft.genre">article</x:option>

            <x:option name="rft.title">
              <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
              <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            </x:option>

            <xsl:choose>
              <xsl:when test="datafield[@tag=100]">
                <x:option name="rft.creator">
                  <xsl:value-of select="datafield[@tag=100]/subfield[@code='a']"/>
                </x:option>
              </xsl:when>
              <xsl:when test="datafield[@tag=700]">
                <xsl:for-each select="datafield[@tag=700]">
                  <x:option name="rft.creator">
                    <xsl:value-of select="./subfield[@code='a']"/>
                  </x:option>
                </xsl:for-each>
              </xsl:when>
            </xsl:choose>

            <xsl:for-each select="datafield[@tag=650]">
              <x:option name="rft.subject">
                <xsl:value-of select="./subfield[@code='a']"/>
              </x:option>
            </xsl:for-each>

            <x:option name="description">
              <xsl:value-of select="datafield[@tag=500]/subfield[@code='a']"/>
            </x:option>

            <x:option name="rft.publisher">
              <xsl:value-of select="datafield[@tag=260]/subfield[@code='b']"/>
            </x:option>

            <x:option name="rft.date">
              <xsl:value-of select="datafield[@tag=260]/subfield[@code='c']"/>
            </x:option>

            <x:option name="rft_id">
              <xsl:text>http://hdl.handle.net/2027/</xsl:text><xsl:value-of select="$gHtId"/>
            </x:option>

            <x:option name="rft.format">
              <xsl:value-of select="$format"/>
            </x:option>
          </xsl:otherwise>
        </xsl:choose>
      </x:select>
    </xsl:variable>

    <xsl:call-template name="generate-coins-span">
      <xsl:with-param name="options" select="exsl:node-set($tmp-data)" />
    </xsl:call-template>

  </xsl:template>

  <xsl:template name="collItem2coins">
    <!-- place holder for adding COinS to the collection builder list -->
    <xsl:variable name="tmp-data">
      <x:select>
        <x:option name="rft_val_fmt">info:ofi/fmt:kev:mtx:book</x:option>
        <x:option name="rft.title"><xsl:value-of select="./Title" /></x:option>
        <x:option name="rft.year"><xsl:value-of select="./Date" /></x:option>
        <xsl:variable name="author" select="./Author" />
        <x:option name="rft.au"><xsl:value-of select="substring-before($author, ',')" /></x:option>
        <x:option name="rft_id">
          <xsl:variable name="PtHref" select="./PtHref" />
          <xsl:variable name="id"     select='substring-after($PtHref,"=")'/>
          <xsl:text>http://hdl.handle.net/2027/</xsl:text><xsl:value-of select="$id"/>        
        </x:option>
      </x:select>
    </xsl:variable>

    <xsl:call-template name="generate-coins-span">
      <xsl:with-param name="tmp" select="exsl:node-set($tmp-data)" />
    </xsl:call-template>

<!--     <span class="Z3988">
      <xsl:attribute name="title">
        <xsl:text>ctx_ver=Z39.88-2004</xsl:text>
        <xsl:text>&amp;rft_val_fmt=info:ofi/fmt:kev:mtx:book</xsl:text>

        <xsl:text>&amp;rft.title=</xsl:text><xsl:value-of select="./Title" />
        <xsl:text>&amp;rft.year=</xsl:text><xsl:value-of select="./Date" />

        <xsl:variable name="author" select="./Author" />
        <xsl:text>&amp;rft.au=</xsl:text><xsl:value-of select="substring-before($author, ',')" />

        <xsl:variable name="PtHref" select="./PtHref" />
        <xsl:variable name="id"     select='substring-after($PtHref,"=")'/>
        <xsl:text>&amp;rft_id=http://hdl.handle.net/2027/</xsl:text><xsl:value-of select="$id" />
      </xsl:attribute>
    </span> -->
  </xsl:template>

  <xsl:template name="generate-coins-span">
    <xsl:param name="options" />
    <xsl:if test="count($options//x:option[normalize-space(.)]) > 0">

      <span class="Z3988">
        <xsl:attribute name="title">
          <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
          <xsl:for-each select="$options//x:option[normalize-space(.)]">
            <xsl:variable name="value" select="normalize-space(.)" />
            <xsl:value-of select="@name" /><xsl:text>=</xsl:text><xsl:value-of select="$value" /><xsl:if test="position() &lt; last()">&amp;</xsl:if>
          </xsl:for-each>
        </xsl:attribute>
      </span>

    </xsl:if>
  </xsl:template>    

</xsl:stylesheet>

